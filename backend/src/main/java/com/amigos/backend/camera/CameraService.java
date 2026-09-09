package com.amigos.backend.camera;

import com.amigos.backend.camera.dto.CameraRequest;
import com.amigos.backend.camera.dto.CameraResponse;
import com.amigos.backend.camera.dto.CameraSegmentRequest;
import com.amigos.backend.common.GeoUtils;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CameraService {

    private final CameraRepository cameraRepository;
    private final CameraSegmentRepository segmentRepository;

    public CameraService(CameraRepository cameraRepository, CameraSegmentRepository segmentRepository) {
        this.cameraRepository = cameraRepository;
        this.segmentRepository = segmentRepository;
    }

    public CameraResponse create(CameraRequest request) {
        Camera camera = new Camera();
        camera.setCameraId(request.cameraId());
        camera.setCityId(request.cityId());
        camera.setStateId(request.stateId());
        camera.setGeo(GeoUtils.toPoint(request.lat(), request.lng()));
        camera.setOrientation(request.orientation());
        camera.setLaneMetadata(request.laneMetadata());

        return toResponse(cameraRepository.save(camera));
    }

    public List<CameraResponse> findAll() {
        return cameraRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<CameraResponse> findByCity(String cityId) {
        return cameraRepository.findByCityId(cityId).stream().map(this::toResponse).toList();
    }

    public CameraResponse findById(String cameraId) {
        Camera camera = cameraRepository.findById(cameraId)
            .orElseThrow(() -> new ResourceNotFoundException("Camera not found: " + cameraId));
        return toResponse(camera);
    }

    public void delete(String cameraId) {
        if (!cameraRepository.existsById(cameraId)) {
            throw new ResourceNotFoundException("Camera not found: " + cameraId);
        }
        cameraRepository.deleteById(cameraId);
    }

    public CameraSegment addSegment(String fromCameraId, CameraSegmentRequest request) {
        if (!cameraRepository.existsById(fromCameraId)) {
            throw new ResourceNotFoundException("Camera not found: " + fromCameraId);
        }
        if (!cameraRepository.existsById(request.toCameraId())) {
            throw new ResourceNotFoundException("Camera not found: " + request.toCameraId());
        }

        CameraSegment segment = new CameraSegment();
        segment.setFromCameraId(fromCameraId);
        segment.setToCameraId(request.toCameraId());
        segment.setRoadDistanceMeters(request.roadDistanceMeters());
        return segmentRepository.save(segment);
    }

    public List<CameraSegment> getSegments(String cameraId) {
        return segmentRepository.findByFromCameraId(cameraId);
    }

    private CameraResponse toResponse(Camera c) {
        return new CameraResponse(
            c.getCameraId(),
            c.getCityId(),
            c.getStateId(),
            GeoUtils.getLat(c.getGeo()),
            GeoUtils.getLng(c.getGeo()),
            c.getOrientation(),
            c.getStatus().name()
        );
    }
}
