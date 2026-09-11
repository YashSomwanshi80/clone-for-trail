package com.amigos.backend.detection.dto;

public record VerifyDetectionRequest(
    String correctedPlateNumber,
    String verifiedBy
) {}
