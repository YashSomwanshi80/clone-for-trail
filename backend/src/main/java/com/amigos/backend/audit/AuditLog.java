package com.amigos.backend.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String actor; // username

    @Column(nullable = false, length = 64)
    private String action; // e.g. "TRAJECTORY_QUERY"

    @Column(name = "target_plate", length = 32)
    private String targetPlate;

    @Column(nullable = false, updatable = false)
    private Instant timestamp = Instant.now();
}
