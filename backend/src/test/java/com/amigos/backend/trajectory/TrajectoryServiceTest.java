package com.amigos.backend.trajectory;

import com.amigos.backend.common.GeoUtils;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.detection.Detection;
import com.amigos.backend.detection.DetectionRepository;
import com.amigos.backend.trajectory.dto.TrajectoryPointResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrajectoryServiceTest {

    @Mock
    private DetectionRepository detectionRepository;

    @InjectMocks
    private TrajectoryService trajectoryService;

    @Test
    void getTrajectory_returnsOrderedPoints() {
        Instant from = Instant.parse("2026-09-09T00:00:00Z");
        Instant to = Instant.parse("2026-09-09T23:59:59Z");

        Detection d1 = buildDetection("CAM001", 28.61, 77.20, from.plusSeconds(60), "N");
        Detection d2 = buildDetection("CAM002", 28.65, 77.25, from.plusSeconds(300), "N");

        when(detectionRepository.findByPlateNumberAndTimestampBetweenOrderByTimestampAsc("DL01AB1234", from, to))
            .thenReturn(List.of(d1, d2));

        List<TrajectoryPointResponse> result = trajectoryService.getTrajectory("DL01AB1234", from, to);

        assertEquals(2, result.size());
        assertEquals("CAM001", result.get(0).cameraId());
        assertEquals("CAM002", result.get(1).cameraId());
    }

    @Test
    void getLastSeen_throwsWhenNoSightingsExist() {
        when(detectionRepository.findTopByPlateNumberOrderByTimestampDesc("UNSEEN123"))
            .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> trajectoryService.getLastSeen("UNSEEN123"));
    }

    @Test
    void getLastSeen_returnsMostRecentPoint() {
        Detection detection = buildDetection("CAM003", 28.70, 77.30, Instant.now(), "S");
        when(detectionRepository.findTopByPlateNumberOrderByTimestampDesc("DL01AB1234"))
            .thenReturn(Optional.of(detection));

        TrajectoryPointResponse result = trajectoryService.getLastSeen("DL01AB1234");

        assertEquals("CAM003", result.cameraId());
        assertEquals("S", result.direction());
    }

    private Detection buildDetection(String cameraId, double lat, double lng, Instant timestamp, String direction) {
        Detection d = new Detection();
        d.setCameraId(cameraId);
        d.setGeo(GeoUtils.toPoint(lat, lng));
        d.setTimestamp(timestamp);
        d.setDirection(direction);
        d.setConfidence(0.9);
        return d;
    }
}
