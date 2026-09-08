package com.amigos.backend.camera.dto;

public record CameraResponse(
    String cameraId,
    String cityId,
    String stateId,
    Double lat,
    Double lng,
    String orientation,
    String status
) {}
