package com.amigos.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record UserRequest(
    @NotBlank String username,
    @NotBlank String password,
    @NotEmpty Set<String> roles
) {}
