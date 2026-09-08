package com.amigos.backend.detection.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record DetectionEventBatchRequest(
    @NotEmpty @Valid List<DetectionEventRequest> detections
) {}
