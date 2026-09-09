package com.amigos.backend.kafka;

import java.time.Instant;

public record AnalyticsUpdateEvent(
    String cityId,
    UpdateType type,
    Instant timestamp
) {
    public enum UpdateType { DENSITY, SPEED, OD_MATRIX }
}
