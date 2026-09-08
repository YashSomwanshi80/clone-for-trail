package com.amigos.backend.alert.dto;

import com.amigos.backend.alert.Alert;

import java.time.Instant;

public record AlertResponse(
    Long alertId,
    String plateNumber,
    Alert.AlertType type,
    Alert.AlertStatus status,
    String reason,
    Instant createdAt
) {}
