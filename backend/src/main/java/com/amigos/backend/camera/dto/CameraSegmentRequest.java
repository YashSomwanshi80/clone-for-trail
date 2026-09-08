package com.amigos.backend.camera.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CameraSegmentRequest(
    @NotBlank String toCameraId,
    @NotNull Double roadDistanceMeters
) {}
