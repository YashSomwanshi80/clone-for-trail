package com.amigos.backend.detection;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

@Entity
@Table(name = "detections")
@Getter
@Setter
@NoArgsConstructor
public class Detection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detectionId;

    @Column(name = "media_id", nullable = false)
    private String mediaId;

    @Column(name = "city_id", nullable = false, length = 64)
    private String cityId;

    @Column(name = "camera_id", length = 64)
    private String cameraId;

    @Column(name = "plate_number", nullable = false, length = 32)
    private String plateNumber;

    @Column(nullable = false)
    private Double confidence;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point geo;

    @Column(length = 8)
    private String direction; // N, S, E, W, NE, NW, SE, SW

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "cropped_image_path")
    private String croppedImagePath; // e.g. "/media/crops/xyz.jpg" served by Python locally

    @Column(name = "ocr_engine_version", length = 32)
    private String ocrEngineVersion;

    @Column(name = "needs_review", nullable = false)
    private boolean needsReview = false;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
