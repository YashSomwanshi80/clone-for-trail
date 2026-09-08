package com.amigos.backend.alert;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long alertId;

    @Column(name = "city_id", nullable = false, length = 64)
    private String cityId;

    @Column(name = "detection_id", nullable = false)
    private Long detectionId;

    @Column(name = "plate_number", nullable = false, length = 32)
    private String plateNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AlertType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AlertStatus status = AlertStatus.OPEN;

    @Column
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public enum AlertType { BLACKLIST_HIT, ROUTE_ANOMALY }
    public enum AlertStatus { OPEN, ACKNOWLEDGED }
}
