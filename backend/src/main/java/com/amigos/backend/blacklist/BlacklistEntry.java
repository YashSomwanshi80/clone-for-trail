package com.amigos.backend.blacklist;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "blacklist")
@Getter
@Setter
@NoArgsConstructor
public class BlacklistEntry {

    @Id
    @Column(name = "plate_number", length = 32)
    private String plateNumber;

    @Column(name = "city_id", length = 64) // nullable = active in all cities
    private String cityId;

    @Column(nullable = false)
    private String reason;

    @Column(name = "added_by", nullable = false, length = 64)
    private String addedBy;

    @Column(name = "expires_at")
    private Instant expiresAt; // nullable = never expires

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
