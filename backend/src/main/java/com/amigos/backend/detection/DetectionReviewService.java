package com.amigos.backend.detection;

import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.detection.dto.ReviewItemResponse;
import com.amigos.backend.detection.dto.VerifyDetectionRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class DetectionReviewService {

    private final DetectionRepository detectionRepository;

    public DetectionReviewService(DetectionRepository detectionRepository) {
        this.detectionRepository = detectionRepository;
    }

    public List<ReviewItemResponse> listPendingReviews(String cityId) {
        return detectionRepository.findByCityIdAndNeedsReviewTrueAndReviewedAtIsNull(cityId)
            .stream()
            .map(this::toReviewItem)
            .toList();
    }

    public ReviewItemResponse verify(Long detectionId, VerifyDetectionRequest request) {
        Detection detection = detectionRepository.findById(detectionId)
            .orElseThrow(() -> new ResourceNotFoundException("Detection not found: " + detectionId));

        if (request.correctedPlateNumber() != null && !request.correctedPlateNumber().isBlank()) {
            detection.setPlateNumber(request.correctedPlateNumber());
        }

        detection.setNeedsReview(false);
        detection.setReviewedAt(Instant.now());
        detection.setReviewedBy(request.verifiedBy());

        return toReviewItem(detectionRepository.save(detection));
    }

    private ReviewItemResponse toReviewItem(Detection d) {
        return new ReviewItemResponse(
            d.getDetectionId(),
            d.getPlateNumber(),
            d.getConfidence(),
            d.getCroppedImagePath(),
            d.getTimestamp(),
            d.getCameraId(),
            d.getCityId()
        );
    }
}
