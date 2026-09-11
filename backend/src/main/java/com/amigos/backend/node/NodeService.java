package com.amigos.backend.node;

import com.amigos.backend.camera.Camera;
import com.amigos.backend.camera.CameraRepository;
import com.amigos.backend.common.GeoUtils;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.node.dto.CreateNodeRequest;
import com.amigos.backend.node.dto.NodeResponse;
import com.amigos.backend.security.RoleConstants;
import com.amigos.backend.user.Role;
import com.amigos.backend.user.RoleRepository;
import com.amigos.backend.user.User;
import com.amigos.backend.user.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class NodeService {

    private final CameraRepository cameraRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public NodeService(CameraRepository cameraRepository, UserRepository userRepository,
                       RoleRepository roleRepository) {
        this.cameraRepository = cameraRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public NodeResponse create(CreateNodeRequest request) {
        // Create camera row
        Camera camera = new Camera();
        camera.setCameraId(request.nodeName());
        camera.setCityId(request.cityId());
        camera.setStateId(request.stateId());
        camera.setGeo(GeoUtils.toPoint(request.lat(), request.lng()));

        cameraRepository.save(camera);

        // Create user row linked to camera
        Role nodeRole = roleRepository.findById(RoleConstants.NODE)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + RoleConstants.NODE));

        User user = new User();
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(nodeRole));
        user.setCameraId(camera.getCameraId());

        userRepository.save(user);

        return new NodeResponse(
            user.getUserId(),
            camera.getCameraId(),
            request.nodeName(),
            user.getUsername(),
            request.lat(),
            request.lng(),
            request.cityId()
        );
    }

    public List<NodeResponse> listAll() {
        return userRepository.findByCameraIdIsNotNull().stream()
            .map(user -> {
                Camera camera = cameraRepository.findById(user.getCameraId())
                    .orElseThrow(() -> new ResourceNotFoundException("Camera not found: " + user.getCameraId()));
                return new NodeResponse(
                    user.getUserId(),
                    camera.getCameraId(),
                    camera.getCameraId(), // nodeName is cameraId
                    user.getUsername(),
                    GeoUtils.getLat(camera.getGeo()),
                    GeoUtils.getLng(camera.getGeo()),
                    camera.getCityId()
                );
            })
            .toList();
    }
}
