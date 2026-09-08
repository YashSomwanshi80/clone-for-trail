package com.amigos.backend.alert;

import com.amigos.backend.alert.dto.AlertResponse;
import com.amigos.backend.blacklist.BlacklistService;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.detection.dto.DetectionEventRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final BlacklistService blacklistService;

    public AlertService(AlertRepository alertRepository, BlacklistService blacklistService) {
        this.alertRepository = alertRepository;
        this.blacklistService = blacklistService;
    }

    // called by AlertConsumer for every incoming detection event
    public Optional<Alert> raiseIfBlacklisted(DetectionEventRequest event, Long detectionId, String cityId) {
        if (!blacklistService.isBlacklisted(event.plateNumber())) {
            return Optional.empty();
        }

        String reason = blacklistService.getReason(event.plateNumber())
            .map(entry -> entry.getReason())
            .orElse("Blacklisted plate");

        Alert alert = new Alert();
        alert.setCityId(cityId);
        alert.setDetectionId(detectionId);
        alert.setPlateNumber(event.plateNumber());
        alert.setType(Alert.AlertType.BLACKLIST_HIT);
        alert.setReason(reason);

        return Optional.of(alertRepository.save(alert));
        // TODO: publish to anpr.alerts topic here once AlertWebSocketHandler is wired
    }

    public List<AlertResponse> list(String status) {
        List<Alert> alerts = (status != null)
            ? alertRepository.findByStatus(Alert.AlertStatus.valueOf(status))
            : alertRepository.findAll();
        return alerts.stream().map(this::toResponse).toList();
    }

    public AlertResponse acknowledge(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
            .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + alertId));
        alert.setStatus(Alert.AlertStatus.ACKNOWLEDGED);
        return toResponse(alertRepository.save(alert));
    }

    private AlertResponse toResponse(Alert a) {
        return new AlertResponse(a.getAlertId(), a.getPlateNumber(), a.getType(), a.getStatus(), a.getReason(), a.getCreatedAt());
    }
}
