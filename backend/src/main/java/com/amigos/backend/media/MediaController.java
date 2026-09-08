package com.amigos.backend.media;

import com.amigos.backend.media.dto.MediaRegisterRequest;
import com.amigos.backend.media.dto.MediaResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/media")
public class MediaController {

    private final MediaService mediaService;

    public MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping
    public ResponseEntity<MediaResponse> register(@Valid @RequestBody MediaRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mediaService.register(request));
    }

    @GetMapping("/{mediaId}")
    public MediaResponse getOne(@PathVariable String mediaId) {
        return mediaService.getById(mediaId);
    }

    @GetMapping
    public List<MediaResponse> listManualUploads(@RequestParam(required = false) String sourceType) {
        // only MANUAL_UPLOAD filtering is wired for now — matches the upload-portal history view in the SRS
        return mediaService.findManualUploads();
    }
}
