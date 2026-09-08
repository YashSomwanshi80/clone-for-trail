package com.amigos.backend.camera;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CameraSegmentRepository extends JpaRepository<CameraSegment, Long> {
    List<CameraSegment> findByFromCameraId(String fromCameraId);
}
