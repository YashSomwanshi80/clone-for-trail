package com.amigos.backend.user.dto;

import java.time.Instant;
import java.util.Set;

public record UserResponse(
    String userId,
    String username,
    Set<String> roles,
    Instant createdAt
) {}
