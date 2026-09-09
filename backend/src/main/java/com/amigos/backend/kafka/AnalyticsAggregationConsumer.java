package com.amigos.backend.kafka;

import com.amigos.backend.camera.CameraSegment;
import com.amigos.backend.camera.CameraSegmentRepository;
import com.amigos.backend.detection.dto.DetectionEventRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Component
public class AnalyticsAggregationConsumer {

    // grid resolution for density/heatmap — ~0.01 degrees is roughly 1km at the equator.
    // NOTE: a proper H3-hexagon grid is the documented future upgrade (see SRS); this is
    // a pragmatic flat lat/lng rounding for local-pilot scale.
    private static final double GRID_RESOLUTION = 0.01;
    private static final Duration DENSITY_WINDOW = Duration.ofMinutes(5);

    private final RedisTemplate<String, String> redisTemplate;
    private final CameraSegmentRepository segmentRepository;
    private final KafkaTemplate<String, AnalyticsUpdateEvent> analyticsKafkaTemplate;

    public AnalyticsAggregationConsumer(
            RedisTemplate<String, String> redisTemplate,
            CameraSegmentRepository segmentRepository,
            KafkaTemplate<String, AnalyticsUpdateEvent> analyticsKafkaTemplate) {
        this.redisTemplate = redisTemplate;
        this.segmentRepository = segmentRepository;
        this.analyticsKafkaTemplate = analyticsKafkaTemplate;
    }

    @KafkaListener(topics = KafkaTopics.DETECTION_EVENTS, groupId = "analytics-consumer")
    public void onDetectionEvent(DetectionPersistedEvent event) {
        DetectionEventRequest raw = event.raw();
        String cityId = event.cityId();

        updateDensity(cityId, raw.lat(), raw.lng());
        updateOriginDestination(cityId, raw.plateNumber(), raw.cameraId());
        updateSpeed(raw.plateNumber(), raw.cameraId(), raw.timestamp());

        recordLastSeen(raw.plateNumber(), raw.cameraId(), raw.timestamp());
    }

    private void updateDensity(String cityId, double lat, double lng) {
        String gridCell = gridCellFor(lat, lng);
        String key = "density:" + cityId + ":" + gridCell;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            // only set TTL on first increment — subsequent increments shouldn't reset the window early
            redisTemplate.expire(key, DENSITY_WINDOW.toSeconds(), TimeUnit.SECONDS);
        }
        publishUpdate(cityId, AnalyticsUpdateEvent.UpdateType.DENSITY);
    }

    private void updateOriginDestination(String cityId, String plateNumber, String toCameraId) {
        if (toCameraId == null) return;

        String lastCameraKey = "od:lastcamera:" + plateNumber;
        String fromCameraId = redisTemplate.opsForValue().get(lastCameraKey);

        if (fromCameraId != null && !fromCameraId.equals(toCameraId)) {
            String odKey = "od:" + cityId + ":" + fromCameraId + ":" + toCameraId;
            redisTemplate.opsForValue().increment(odKey);
            publishUpdate(cityId, AnalyticsUpdateEvent.UpdateType.OD_MATRIX);
        }

        redisTemplate.opsForValue().set(lastCameraKey, toCameraId, Duration.ofHours(6));
    }

    private void updateSpeed(String plateNumber, String toCameraId, Instant timestamp) {
        if (toCameraId == null) return;

        String lastSeenKey = "lastseen:" + plateNumber;
        String lastSeenValue = redisTemplate.opsForValue().get(lastSeenKey);
        if (lastSeenValue == null) return; // first sighting of this plate — nothing to compute yet

        String[] parts = lastSeenValue.split("\\|");
        String fromCameraId = parts[0];
        long fromTimestampMillis = Long.parseLong(parts[1]);

        if (fromCameraId.equals(toCameraId)) return; // same camera, no movement to measure

        Optional<CameraSegment> segment =
            segmentRepository.findByFromCameraIdAndToCameraId(fromCameraId, toCameraId);
        if (segment.isEmpty()) return; // no registered road distance for this pair — can't compute speed

        double distanceMeters = segment.get().getRoadDistanceMeters();
        long deltaMillis = timestamp.toEpochMilli() - fromTimestampMillis;
        if (deltaMillis <= 0) return; // guard against out-of-order events

        double hours = deltaMillis / 3_600_000.0;
        double speedKph = (distanceMeters / 1000.0) / hours;

        String segmentKey = "speed:" + fromCameraId + ":" + toCameraId;
        // rolling average: store as "sum|count", cheap and good enough for local-pilot scale
        String existing = redisTemplate.opsForValue().get(segmentKey);
        double sum = speedKph;
        long count = 1;
        if (existing != null) {
            String[] sc = existing.split("\\|");
            sum += Double.parseDouble(sc[0]);
            count += Long.parseLong(sc[1]);
        }
        redisTemplate.opsForValue().set(segmentKey, sum + "|" + count, Duration.ofHours(1));
    }

    private void recordLastSeen(String plateNumber, String cameraId, Instant timestamp) {
        if (cameraId == null) return;
        String key = "lastseen:" + plateNumber;
        redisTemplate.opsForValue().set(key, cameraId + "|" + timestamp.toEpochMilli(), Duration.ofHours(6));
    }

    private void publishUpdate(String cityId, AnalyticsUpdateEvent.UpdateType type) {
        analyticsKafkaTemplate.send(
            KafkaTopics.ANALYTICS_AGGREGATES, cityId,
            new AnalyticsUpdateEvent(cityId, type, Instant.now()));
    }

    private String gridCellFor(double lat, double lng) {
        double roundedLat = Math.round(lat / GRID_RESOLUTION) * GRID_RESOLUTION;
        double roundedLng = Math.round(lng / GRID_RESOLUTION) * GRID_RESOLUTION;
        return roundedLat + "_" + roundedLng;
    }
}
