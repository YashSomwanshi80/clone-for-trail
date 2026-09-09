package com.amigos.backend.kafka;

import com.amigos.backend.alert.Alert;
import com.amigos.backend.alert.AlertService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AlertConsumer {

    private final AlertService alertService;
    private final KafkaTemplate<String, Alert> alertKafkaTemplate;

    public AlertConsumer(AlertService alertService, KafkaTemplate<String, Alert> alertKafkaTemplate) {
        this.alertService = alertService;
        this.alertKafkaTemplate = alertKafkaTemplate;
    }

    @KafkaListener(topics = KafkaTopics.DETECTION_EVENTS, groupId = "alert-consumer")
    public void onDetectionEvent(DetectionPersistedEvent event) {
        Optional<Alert> raised = alertService.raiseIfBlacklisted(
            event.raw(), event.detectionId(), event.cityId());

        // publish only if an alert was actually raised — pushes to /ws/alerts via the relay below
        raised.ifPresent(alert ->
            alertKafkaTemplate.send(KafkaTopics.ALERTS, alert.getPlateNumber(), alert));
    }
}
