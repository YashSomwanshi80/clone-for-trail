package com.amigos.backend.alert;

import com.amigos.backend.alert.dto.AlertResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<AlertResponse> list(@RequestParam(required = false) String status) {
        return alertService.list(status);
    }

    @PutMapping("/{alertId}/acknowledge")
    public AlertResponse acknowledge(@PathVariable Long alertId) {
        return alertService.acknowledge(alertId);
    }
}
