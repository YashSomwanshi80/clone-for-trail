package com.amigos.backend.detection;

import com.amigos.backend.camera.CameraRepository;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.detection.dto.DetectionEventRequest;
import com.amigos.backend.kafka.KafkaTopics;
import com.amigos.backend.media.MediaRepository;
import com.amigos.backend.media.MediaService;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class DetectionIngestionService {

    private static final GeometryFactory GEOMETRY_FACTORY =
        new GeometryFactory(new PrecisionModel(), 4326);

    private final DetectionRepository detectionRepository;
    private final CameraRepository cameraRepository;
    private final MediaRepository mediaRepository;
    private final MediaService mediaService;
    private final KafkaTemplate<String, DetectionEventRequest> kafkaTemplate;

    public DetectionIngestionService(
            DetectionRepository detectionRepository,
            CameraRepository cameraRepository,
            MediaRepository mediaRepository,
            MediaService mediaService,
            KafkaTemplate<String, DetectionEventRequest> kafkaTemplate) {
        this.detectionRepository = detectionRepository;
        this.cameraRepository = cameraRepository;
        this.mediaRepository = mediaRepository;
        this.mediaService = mediaService;
        this.kafkaTemplate = kafkaTemplate;
    }

    public void ingest(DetectionEventRequest event) {
        Detection detection = new Detection();
        detection.setMediaId(event.mediaId());
        detection.setCityId(resolveCityId(event));
        detection.setCameraId(event.cameraId());
        detection.setPlateNumber(event.plateNumber());
        detection.setConfidence(event.confidence());
        detection.setGeo(toPoint(event.lat(), event.lng()));
        detection.setDirection(event.direction());
        detection.setTimestamp(event.timestamp());
        detection.setCroppedImagePath(event.croppedPlateImagePath());
        detection.setOcrEngineVersion(event.ocrEngineVersion());

        detectionRepository.save(detection);
        mediaService.markCompleted(event.mediaId());

        // fan-out point: alert (and later, analytics) consumers react to this independently
        kafkaTemplate.send(KafkaTopics.DETECTION_EVENTS, event.plateNumber(), event);
    }

    private String resolveCityId(DetectionEventRequest event) {
        // prefer the camera's cityId when a camera is attached (live feed case)
        if (event.cameraId() != null) {
            var camera = cameraRepository.findById(event.cameraId());
            if (camera.isPresent()) {
                return camera.get().getCityId();
            }
        }
        // fall back to the Media record's cityId (covers manual uploads with no camera)
        return mediaRepository.findById(event.mediaId())
            .orElseThrow(() -> new ResourceNotFoundException("Media not found: " + event.mediaId()))
            .getCityId();
    }

    private Point toPoint(double lat, double lng) {
        return GEOMETRY_FACTORY.createPoint(new Coordinate(lng, lat));
    }
}
