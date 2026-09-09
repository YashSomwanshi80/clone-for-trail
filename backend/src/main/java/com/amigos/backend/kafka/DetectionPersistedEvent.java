package com.amigos.backend.kafka;

import com.amigos.backend.detection.dto.DetectionEventRequest;

public record DetectionPersistedEvent(
    Long detectionId,
    String cityId,
    DetectionEventRequest raw // the original Python payload, untouched
) {}
