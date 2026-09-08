package com.amigos.backend.camera;

import com.amigos.backend.camera.dto.CameraRequest;
import com.amigos.backend.camera.dto.CameraResponse;
import com.amigos.backend.camera.dto.CameraSegmentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cameras")
public class CameraController {

    private final CameraService cameraService;

    public CameraController(CameraService cameraService) {
        this.cameraService = cameraService;
    }

    @PostMapping
    public ResponseEntity<CameraResponse> create(@Valid @RequestBody CameraRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cameraService.create(request));
    }

    @GetMapping
    public List<CameraResponse> list(@RequestParam(required = false) String cityId) {
        return (cityId != null) ? cameraService.findByCity(cityId) : cameraService.findAll();
    }

    @GetMapping("/{cameraId}")
    public CameraResponse getOne(@PathVariable String cameraId) {
        return cameraService.findById(cameraId);
    }

    @DeleteMapping("/{cameraId}")
    public ResponseEntity<Void> delete(@PathVariable String cameraId) {
        cameraService.delete(cameraId);
        return ResponseEntity.noContent().build();
    }
}
