package com.amigos.backend.trajectory.dto;

import java.time.Instant;

public record TrajectoryPointResponse(
    String cameraId,
    Double lat,
    Double lng,
    Instant timestamp,
    String direction,
    Double confidence
) {}
