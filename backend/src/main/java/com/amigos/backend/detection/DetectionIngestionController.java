package com.amigos.backend.detection;

import com.amigos.backend.detection.dto.DetectionEventBatchRequest;
import com.amigos.backend.detection.dto.DetectionEventRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/internal/v1/detections")
public class DetectionIngestionController {

    private final DetectionIngestionService ingestionService;

    public DetectionIngestionController(DetectionIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping
    public ResponseEntity<Void> ingestOne(@Valid @RequestBody DetectionEventRequest request) {
        ingestionService.ingest(request);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/batch")
    public ResponseEntity<Void> ingestBatch(@Valid @RequestBody DetectionEventBatchRequest request) {
        request.detections().forEach(ingestionService::ingest);
        return ResponseEntity.accepted().build();
    }
}
