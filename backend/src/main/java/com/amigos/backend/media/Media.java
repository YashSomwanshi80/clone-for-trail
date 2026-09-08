package com.amigos.backend.media;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "media")
@Getter
@Setter
@NoArgsConstructor
public class Media {

    @Id
    @Column(name = "media_id")
    private String mediaId = UUID.randomUUID().toString();

    @Column(name = "city_id", nullable = false, length = 64)
    private String cityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 16)
    private SourceType sourceType;

    @Column(name = "camera_id", length = 64) // nullable — manual uploads may have no camera
    private String cameraId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 16)
    private MediaType mediaType;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private MediaStatus status = MediaStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum SourceType { LIVE, MANUAL_UPLOAD }
    public enum MediaType { IMAGE, VIDEO }
    public enum MediaStatus { PENDING, PROCESSING, COMPLETED, FAILED }
}
