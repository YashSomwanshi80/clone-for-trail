package com.amigos.backend.media;

import com.amigos.backend.common.exception.ResourceNotFoundException;
import com.amigos.backend.media.dto.MediaRegisterRequest;
import com.amigos.backend.media.dto.MediaResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;

    public MediaService(MediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    public MediaResponse register(MediaRegisterRequest request) {
        Media media = new Media();
        media.setCityId(request.cityId());
        media.setSourceType(request.sourceType());
        media.setCameraId(request.cameraId());
        media.setMediaType(request.mediaType());
        media.setCapturedAt(request.capturedAt());
        // status defaults to PENDING, mediaId auto-generated in the entity

        return toResponse(mediaRepository.save(media));
    }

    public MediaResponse getById(String mediaId) {
        Media media = mediaRepository.findById(mediaId)
            .orElseThrow(() -> new ResourceNotFoundException("Media not found: " + mediaId));
        return toResponse(media);
    }

    public List<MediaResponse> findManualUploads() {
        return mediaRepository.findBySourceType(Media.SourceType.MANUAL_UPLOAD)
            .stream().map(this::toResponse).toList();
    }

    // called by the Detection module once Python's result lands — see DetectionIngestionService
    public void markCompleted(String mediaId) {
        Media media = mediaRepository.findById(mediaId)
            .orElseThrow(() -> new ResourceNotFoundException("Media not found: " + mediaId));
        media.setStatus(Media.MediaStatus.COMPLETED);
        mediaRepository.save(media);
    }

    public void markFailed(String mediaId) {
        Media media = mediaRepository.findById(mediaId)
            .orElseThrow(() -> new ResourceNotFoundException("Media not found: " + mediaId));
        media.setStatus(Media.MediaStatus.FAILED);
        mediaRepository.save(media);
    }

    private MediaResponse toResponse(Media m) {
        return new MediaResponse(
            m.getMediaId(), m.getSourceType(), m.getCameraId(),
            m.getMediaType(), m.getCapturedAt(), m.getStatus(), null
        );
    }
}
