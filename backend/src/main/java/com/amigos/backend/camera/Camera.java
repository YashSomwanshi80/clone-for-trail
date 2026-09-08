package com.amigos.backend.camera;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

@Entity
@Table(name = "cameras")
@Getter
@Setter
@NoArgsConstructor
public class Camera {

    @Id
    @Column(name = "camera_id", length = 64)
    private String cameraId;

    @Column(name = "city_id", nullable = false, length = 64)
    private String cityId;

    @Column(name = "state_id", nullable = false, length = 64)
    private String stateId;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point geo;

    @Column(length = 32)
    private String orientation;

    @Column(name = "lane_metadata")
    private String laneMetadata;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CameraStatus status = CameraStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum CameraStatus {
        ACTIVE, INACTIVE, MAINTENANCE
    }
}
