package com.amigos.backend.media.dto;

import com.amigos.backend.media.Media;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record MediaRegisterRequest(
    @NotNull Media.SourceType sourceType,
    String cameraId,          // nullable if MANUAL_UPLOAD with no camera
    @NotNull Media.MediaType mediaType,
    @NotNull Instant capturedAt,
    @NotNull String cityId
) {}
