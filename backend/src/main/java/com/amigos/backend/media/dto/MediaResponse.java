package com.amigos.backend.media.dto;

import com.amigos.backend.media.Media;

import java.time.Instant;

public record MediaResponse(
    String mediaId,
    Media.SourceType sourceType,
    String cameraId,
    Media.MediaType mediaType,
    Instant capturedAt,
    Media.MediaStatus status,
    Object detectionResult // populated once COMPLETED — typed properly once DetectionResponse exists
) {}
