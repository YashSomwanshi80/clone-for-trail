package com.amigos.backend.camera.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CameraRequest(
    @NotBlank String cameraId,
    @NotBlank String cityId,
    @NotBlank String stateId,
    @NotNull Double lat,
    @NotNull Double lng,
    String orientation,
    String laneMetadata
) {}
