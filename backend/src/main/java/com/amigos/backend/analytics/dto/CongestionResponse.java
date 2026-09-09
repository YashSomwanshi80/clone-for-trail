package com.amigos.backend.analytics.dto;

import java.util.List;

public record CongestionResponse(String cityId, List<CongestionZone> zones) {}
