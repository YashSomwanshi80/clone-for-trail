package com.amigos.backend.kafka;

import com.amigos.backend.alert.AlertService;
import com.amigos.backend.detection.Detection;
import com.amigos.backend.detection.DetectionRepository;
import com.amigos.backend.detection.dto.DetectionEventRequest;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AlertConsumer {

    private final AlertService alertService;
    private final DetectionRepository detectionRepository;

    public AlertConsumer(AlertService alertService, DetectionRepository detectionRepository) {
        this.alertService = alertService;
        this.detectionRepository = detectionRepository;
    }

    @KafkaListener(topics = KafkaTopics.DETECTION_EVENTS, groupId = "alert-consumer")
    public void onDetectionEvent(DetectionEventRequest event) {
        // look up the detection we just persisted synchronously in DetectionIngestionService,
        // to get its generated ID and resolved cityId for the alert record
        Detection detection = detectionRepository
            .findTopByPlateNumberOrderByTimestampDesc(event.plateNumber())
            .orElse(null);

        if (detection == null) return; // shouldn't happen, but don't blow up the consumer thread

        alertService.raiseIfBlacklisted(event, detection.getDetectionId(), detection.getCityId());
    }
}
