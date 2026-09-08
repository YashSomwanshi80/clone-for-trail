package com.amigos.backend.trajectory;

import com.amigos.backend.trajectory.dto.TrajectoryPointResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
public class TrajectoryController {

    private final TrajectoryService trajectoryService;

    public TrajectoryController(TrajectoryService trajectoryService) {
        this.trajectoryService = trajectoryService;
    }

    @GetMapping("/api/v1/trajectories/{plateNumber}")
    public List<TrajectoryPointResponse> getTrajectory(
            @PathVariable String plateNumber,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return trajectoryService.getTrajectory(plateNumber, from, to);
    }

    @GetMapping("/api/v1/plates/{plateNumber}/last-seen")
    public TrajectoryPointResponse getLastSeen(@PathVariable String plateNumber) {
        return trajectoryService.getLastSeen(plateNumber);
    }
}
