package com.amigos.backend.config;

import com.amigos.backend.user.Role;
import com.amigos.backend.user.RoleRepository;
import com.amigos.backend.user.User;
import com.amigos.backend.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DataSeeder(RoleRepository roleRepository, UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        seedRoleIfMissing("TRAFFIC_POLICE", "Can query trajectories and manage blacklist/alerts");
        seedRoleIfMissing("CITY_ADMIN", "Full administrative access");
        seedRoleIfMissing("AUDITOR", "Read-only access to aggregate analytics");

        if (userRepository.count() == 0) {
            Role cityAdmin = roleRepository.findById("CITY_ADMIN").orElseThrow();

            User admin = new User();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRoles(Set.of(cityAdmin));
            userRepository.save(admin);

            System.out.println("=================================================");
            System.out.println(" Seeded default admin user for local dev/testing:");
            System.out.println("   username: admin");
            System.out.println("   password: admin123");
            System.out.println(" CHANGE THIS before this goes anywhere near production.");
            System.out.println("=================================================");
        }
    }

    private void seedRoleIfMissing(String name, String description) {
        if (roleRepository.findById(name).isEmpty()) {
            Role role = new Role();
            role.setName(name);
            role.setDescription(description);
            roleRepository.save(role);
        }
    }
}
