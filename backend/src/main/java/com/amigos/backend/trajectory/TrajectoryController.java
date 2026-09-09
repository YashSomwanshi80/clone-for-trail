package com.amigos.backend.trajectory;

import com.amigos.backend.audit.AuditLogService;
import com.amigos.backend.trajectory.dto.TrajectoryPointResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
public class TrajectoryController {

    private final TrajectoryService trajectoryService;
    private final AuditLogService auditLogService;

    public TrajectoryController(TrajectoryService trajectoryService, AuditLogService auditLogService) {
        this.trajectoryService = trajectoryService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/api/v1/trajectories/{plateNumber}")
    public List<TrajectoryPointResponse> getTrajectory(
            @PathVariable String plateNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {

        String actor = SecurityContextHolder.getContext().getAuthentication().getName();
        auditLogService.logTrajectoryQuery(actor, plateNumber);

        return trajectoryService.getTrajectory(plateNumber, from, to);
    }

    @GetMapping("/api/v1/plates/{plateNumber}/last-seen")
    public TrajectoryPointResponse getLastSeen(@PathVariable String plateNumber) {
        String actor = SecurityContextHolder.getContext().getAuthentication().getName();
        auditLogService.logTrajectoryQuery(actor, plateNumber);

        return trajectoryService.getLastSeen(plateNumber);
    }
}
