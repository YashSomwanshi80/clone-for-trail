package com.amigos.backend.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    private String userId = UUID.randomUUID().toString();

    @Column(nullable = false, unique = true, length = 128)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_name")
    )
    private Set<Role> roles = new HashSet<>();

    @Column(name = "camera_id")
    private String cameraId; // nullable — only set for node/camera-operator logins

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
