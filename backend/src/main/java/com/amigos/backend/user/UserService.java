package com.amigos.backend.user;

import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.user.dto.UserRequest;
import com.amigos.backend.user.dto.UserResponse;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public UserResponse create(UserRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        Set<Role> roles = new HashSet<>();
        for (String roleName : request.roles()) {
            Role role = roleRepository.findById(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
            roles.add(role);
        }
        user.setRoles(roles);

        return toResponse(userRepository.save(user));
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public User loadByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(
            u.getUserId(), u.getUsername(),
            u.getRoles().stream().map(Role::getName).collect(Collectors.toSet()),
            u.getCreatedAt()
        );
    }
}
