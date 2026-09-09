package com.amigos.backend.analytics;

import com.amigos.backend.analytics.dto.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class AnalyticsService {

    // congestion thresholds — arbitrary starting point for the pilot, tune once real data exists
    private static final long CONGESTION_MODERATE_THRESHOLD = 10;
    private static final long CONGESTION_HIGH_THRESHOLD = 25;

    private final RedisTemplate<String, String> redisTemplate;

    public AnalyticsService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public HeatmapResponse getHeatmap(String cityId) {
        Set<String> keys = redisTemplate.keys("density:" + cityId + ":*");
        List<HeatmapCell> cells = new ArrayList<>();
        if (keys != null) {
            for (String key : keys) {
                String gridCell = key.substring(("density:" + cityId + ":").length());
                String[] latLng = gridCell.split("_");
                String countStr = redisTemplate.opsForValue().get(key);
                if (countStr == null) continue;
                cells.add(new HeatmapCell(
                    Double.parseDouble(latLng[0]), Double.parseDouble(latLng[1]), Long.parseLong(countStr)));
            }
        }
        return new HeatmapResponse(cityId, cells);
    }

    public DensityResponse getDensity(String cityId, String gridCell) {
        String key = "density:" + cityId + ":" + gridCell;
        String countStr = redisTemplate.opsForValue().get(key);
        return new DensityResponse(gridCell, countStr != null ? Long.parseLong(countStr) : 0);
    }

    public OdMatrixResponse getOdMatrix(String cityId) {
        Set<String> keys = redisTemplate.keys("od:" + cityId + ":*");
        List<OdPair> pairs = new ArrayList<>();
        if (keys != null) {
            for (String key : keys) {
                String remainder = key.substring(("od:" + cityId + ":").length());
                String[] parts = remainder.split(":");
                if (parts.length != 2) continue;
                String countStr = redisTemplate.opsForValue().get(key);
                if (countStr == null) continue;
                pairs.add(new OdPair(parts[0], parts[1], Long.parseLong(countStr)));
            }
        }
        return new OdMatrixResponse(cityId, pairs);
    }

    public CongestionResponse getCongestion(String cityId) {
        Set<String> keys = redisTemplate.keys("density:" + cityId + ":*");
        List<CongestionZone> zones = new ArrayList<>();
        if (keys != null) {
            for (String key : keys) {
                String gridCell = key.substring(("density:" + cityId + ":").length());
                String countStr = redisTemplate.opsForValue().get(key);
                if (countStr == null) continue;
                long count = Long.parseLong(countStr);
                zones.add(new CongestionZone(gridCell, count, congestionLevel(count)));
            }
        }
        return new CongestionResponse(cityId, zones);
    }

    public SpeedResponse getSpeed(String fromCameraId, String toCameraId) {
        String segmentId = fromCameraId + ":" + toCameraId;
        String value = redisTemplate.opsForValue().get("speed:" + segmentId);
        if (value == null) {
            return new SpeedResponse(segmentId, null, 0);
        }
        String[] sumCount = value.split("\\|");
        double sum = Double.parseDouble(sumCount[0]);
        long count = Long.parseLong(sumCount[1]);
        return new SpeedResponse(segmentId, sum / count, count);
    }

    private String congestionLevel(long density) {
        if (density >= CONGESTION_HIGH_THRESHOLD) return "HIGH";
        if (density >= CONGESTION_MODERATE_THRESHOLD) return "MODERATE";
        return "LOW";
    }
}
