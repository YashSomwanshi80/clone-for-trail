package com.amigos.backend.analytics.dto;

public record SpeedResponse(String segmentId, Double averageSpeedKph, long sampleCount) {}
