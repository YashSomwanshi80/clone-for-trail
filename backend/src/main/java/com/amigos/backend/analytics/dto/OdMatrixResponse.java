package com.amigos.backend.analytics.dto;

import java.util.List;

public record OdMatrixResponse(String cityId, List<OdPair> pairs) {}
