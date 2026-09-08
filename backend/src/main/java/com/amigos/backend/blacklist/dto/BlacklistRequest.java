package com.amigos.backend.blacklist.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record BlacklistRequest(
    @NotBlank String plateNumber,
    String cityId, // nullable — omit for "all cities"
    @NotBlank String reason,
    @NotBlank String addedBy,
    Instant expiresAt
) {}
