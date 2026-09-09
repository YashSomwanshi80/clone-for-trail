package com.amigos.backend.analytics.dto;

import java.util.List;

public record HeatmapResponse(String cityId, List<HeatmapCell> cells) {}
