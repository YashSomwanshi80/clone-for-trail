package com.amigos.backend.analytics;

import com.amigos.backend.analytics.dto.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/heatmap")
    public HeatmapResponse getHeatmap(@RequestParam String cityId) {
        return analyticsService.getHeatmap(cityId);
    }

    @GetMapping("/density")
    public DensityResponse getDensity(@RequestParam String cityId, @RequestParam String gridCell) {
        return analyticsService.getDensity(cityId, gridCell);
    }

    @GetMapping("/od-matrix")
    public OdMatrixResponse getOdMatrix(@RequestParam String cityId) {
        return analyticsService.getOdMatrix(cityId);
    }

    @GetMapping("/congestion")
    public CongestionResponse getCongestion(@RequestParam String cityId) {
        return analyticsService.getCongestion(cityId);
    }

    @GetMapping("/speed")
    public SpeedResponse getSpeed(@RequestParam String fromCameraId, @RequestParam String toCameraId) {
        return analyticsService.getSpeed(fromCameraId, toCameraId);
    }
}
