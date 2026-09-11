package com.amigos.backend.detection;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DetectionRepository extends JpaRepository<Detection, Long> {
    // used later by TrajectoryService — ordered by timestamp for a chronological path
    Optional<Detection> findTopByPlateNumberOrderByTimestampDesc(String plateNumber);
    List<Detection> findByPlateNumberAndTimestampBetweenOrderByTimestampAsc(
        String plateNumber, Instant from, Instant to);
    List<Detection> findByCityIdAndNeedsReviewTrueAndReviewedAtIsNull(String cityId);
}
