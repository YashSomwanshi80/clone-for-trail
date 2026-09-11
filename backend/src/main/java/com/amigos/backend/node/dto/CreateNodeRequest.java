package com.amigos.backend.node.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNodeRequest(
    @NotBlank String username,
    @NotBlank String password,
    @NotBlank String nodeName,
    @NotNull Double lat,
    @NotNull Double lng,
    @NotBlank String cityId,
    @NotBlank String stateId
) {}
