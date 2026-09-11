package com.amigos.backend.detection;

import com.amigos.backend.detection.dto.ReviewItemResponse;
import com.amigos.backend.detection.dto.VerifyDetectionRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/detections")
public class DetectionReviewController {

    private final DetectionReviewService reviewService;

    public DetectionReviewController(DetectionReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/review")
    public List<ReviewItemResponse> listPendingReviews(@RequestParam String cityId) {
        return reviewService.listPendingReviews(cityId);
    }

    @PutMapping("/{detectionId}/verify")
    public ReviewItemResponse verify(
            @PathVariable Long detectionId,
            @Valid @RequestBody VerifyDetectionRequest request) {
        return reviewService.verify(detectionId, request);
    }
}
