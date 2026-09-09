package com.amigos.backend.camera;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CameraSegmentRepository extends JpaRepository<CameraSegment, Long> {
    List<CameraSegment> findByFromCameraId(String fromCameraId);
    Optional<CameraSegment> findByFromCameraIdAndToCameraId(String fromCameraId, String toCameraId);
}
