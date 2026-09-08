package com.amigos.backend.camera;

import com.amigos.backend.camera.dto.CameraSegmentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cameras/{cameraId}/segments")
public class CameraSegmentController {

    private final CameraService cameraService;

    public CameraSegmentController(CameraService cameraService) {
        this.cameraService = cameraService;
    }

    @PostMapping
    public ResponseEntity<CameraSegment> addSegment(
            @PathVariable String cameraId,
            @Valid @RequestBody CameraSegmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cameraService.addSegment(cameraId, request));
    }

    @GetMapping
    public List<CameraSegment> getSegments(@PathVariable String cameraId) {
        return cameraService.getSegments(cameraId);
    }
}
