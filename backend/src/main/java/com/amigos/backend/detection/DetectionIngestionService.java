package com.amigos.backend.detection;

import com.amigos.backend.camera.CameraRepository;
import com.amigos.backend.common.GeoUtils;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.detection.dto.DetectionEventRequest;
import com.amigos.backend.kafka.DetectionPersistedEvent;
import com.amigos.backend.kafka.KafkaTopics;
import com.amigos.backend.media.MediaRepository;
import com.amigos.backend.media.MediaService;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class DetectionIngestionService {

    private final DetectionRepository detectionRepository;
    private final CameraRepository cameraRepository;
    private final MediaRepository mediaRepository;
    private final MediaService mediaService;
    private final KafkaTemplate<String, DetectionPersistedEvent> kafkaTemplate;

    public DetectionIngestionService(
            DetectionRepository detectionRepository,
            CameraRepository cameraRepository,
            MediaRepository mediaRepository,
            MediaService mediaService,
            KafkaTemplate<String, DetectionPersistedEvent> kafkaTemplate) {
        this.detectionRepository = detectionRepository;
        this.cameraRepository = cameraRepository;
        this.mediaRepository = mediaRepository;
        this.mediaService = mediaService;
        this.kafkaTemplate = kafkaTemplate;
    }

    public void ingest(DetectionEventRequest event) {
        String cityId = resolveCityId(event);

        Detection detection = new Detection();
        detection.setMediaId(event.mediaId());
        detection.setCityId(cityId);
        detection.setCameraId(event.cameraId());
        detection.setPlateNumber(event.plateNumber());
        detection.setConfidence(event.confidence());
        detection.setGeo(GeoUtils.toPoint(event.lat(), event.lng()));
        detection.setDirection(event.direction());
        detection.setTimestamp(event.timestamp());
        detection.setCroppedImagePath(event.croppedPlateImagePath());
        detection.setOcrEngineVersion(event.ocrEngineVersion());

        Detection saved = detectionRepository.save(detection);
        mediaService.markCompleted(event.mediaId());

        DetectionPersistedEvent persistedEvent =
            new DetectionPersistedEvent(saved.getDetectionId(), cityId, event);

        kafkaTemplate.send(KafkaTopics.DETECTION_EVENTS, event.plateNumber(), persistedEvent);
    }

    private String resolveCityId(DetectionEventRequest event) {
        if (event.cameraId() != null) {
            var camera = cameraRepository.findById(event.cameraId());
            if (camera.isPresent()) {
                return camera.get().getCityId();
            }
        }
        return mediaRepository.findById(event.mediaId())
            .orElseThrow(() -> new ResourceNotFoundException("Media not found: " + event.mediaId()))
            .getCityId();
    }
}
