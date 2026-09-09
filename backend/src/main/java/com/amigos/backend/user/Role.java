package com.amigos.backend.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @Column(length = 32)
    private String name; // e.g. "TRAFFIC_POLICE", "CITY_ADMIN", "AUDITOR"

    private String description;
}
