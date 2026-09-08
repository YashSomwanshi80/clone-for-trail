package com.amigos.backend.camera;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CameraRepository extends JpaRepository<Camera, String> {
    List<Camera> findByCityId(String cityId);
    List<Camera> findByStateId(String stateId);
}
