package com.amigos.backend.camera;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "camera_segments")
@Getter
@Setter
@NoArgsConstructor
public class CameraSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_camera_id", nullable = false, length = 64)
    private String fromCameraId;

    @Column(name = "to_camera_id", nullable = false, length = 64)
    private String toCameraId;

    @Column(name = "road_distance_meters", nullable = false)
    private Double roadDistanceMeters;
}
