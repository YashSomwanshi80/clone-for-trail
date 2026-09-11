package com.amigos.backend.node.dto;

public record NodeResponse(
    String userId,
    String cameraId,
    String nodeName,
    String username,
    Double lat,
    Double lng,
    String cityId
) {}
