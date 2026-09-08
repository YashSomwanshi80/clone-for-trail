package com.amigos.backend.trajectory;

import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.detection.Detection;
import com.amigos.backend.detection.DetectionRepository;
import com.amigos.backend.trajectory.dto.TrajectoryPointResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TrajectoryService {

    private final DetectionRepository detectionRepository;

    public TrajectoryService(DetectionRepository detectionRepository) {
        this.detectionRepository = detectionRepository;
    }

    public List<TrajectoryPointResponse> getTrajectory(String plateNumber, Instant from, Instant to) {
        return detectionRepository
            .findByPlateNumberAndTimestampBetweenOrderByTimestampAsc(plateNumber, from, to)
            .stream()
            .map(this::toPoint)
            .toList();
        // NOTE: response shape here is the forward-compatibility contract from SRS §3.4 —
        // this won't change if cross-city fan-out is added later; only how it's populated will.
    }

    public TrajectoryPointResponse getLastSeen(String plateNumber) {
        Detection detection = detectionRepository.findTopByPlateNumberOrderByTimestampDesc(plateNumber)
            .orElseThrow(() -> new ResourceNotFoundException("No sightings found for plate: " + plateNumber));
        return toPoint(detection);
    }

    private TrajectoryPointResponse toPoint(Detection d) {
        return new TrajectoryPointResponse(
            d.getCameraId(),
            d.getGeo().getY(),
            d.getGeo().getX(),
            d.getTimestamp(),
            d.getDirection(),
            d.getConfidence()
        );
    }
}
