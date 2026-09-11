package com.amigos.backend.detection.dto;

import java.time.Instant;

public record ReviewItemResponse(
    Long detectionId,
    String plateNumber,
    Double confidence,
    String croppedImagePath,
    Instant timestamp,
    String cameraId,
    String cityId
) {}
