package com.amigos.backend.detection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record DetectionEventRequest(
    @NotBlank String mediaId,
    String cameraId, // nullable for a manual upload with no camera
    @NotBlank String plateNumber,
    @NotNull Double confidence,
    @NotNull Double lat,
    @NotNull Double lng,
    String direction,
    @NotNull Instant timestamp,
    String croppedPlateImagePath,
    String ocrEngineVersion
) {}
