package com.amigos.backend.camera;

import com.amigos.backend.camera.dto.CameraRequest;
import com.amigos.backend.camera.dto.CameraResponse;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CameraServiceTest {

    @Mock
    private CameraRepository cameraRepository;

    @Mock
    private CameraSegmentRepository segmentRepository;

    @InjectMocks
    private CameraService cameraService;

    @Test
    void create_savesAndReturnsCamera() {
        CameraRequest request = new CameraRequest("CAM001", "pilot-city-1", "pilot-state-1", 28.6139, 77.2090, "N", null);

        when(cameraRepository.save(any(Camera.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CameraResponse response = cameraService.create(request);

        assertEquals("CAM001", response.cameraId());
        assertEquals("pilot-city-1", response.cityId());
        assertEquals(28.6139, response.lat(), 0.0001);
        assertEquals(77.2090, response.lng(), 0.0001);
        verify(cameraRepository, times(1)).save(any(Camera.class));
    }

    @Test
    void findById_throwsWhenNotFound() {
        when(cameraRepository.findById("MISSING")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> cameraService.findById("MISSING"));
    }

    @Test
    void findByCity_returnsMappedResponses() {
        Camera camera = new Camera();
        camera.setCameraId("CAM001");
        camera.setCityId("pilot-city-1");
        camera.setStateId("pilot-state-1");
        camera.setGeo(com.amigos.backend.common.GeoUtils.toPoint(28.6139, 77.2090));
        camera.setOrientation("N");

        when(cameraRepository.findByCityId("pilot-city-1")).thenReturn(List.of(camera));

        List<CameraResponse> results = cameraService.findByCity("pilot-city-1");

        assertEquals(1, results.size());
        assertEquals("CAM001", results.get(0).cameraId());
    }

    @Test
    void delete_throwsWhenCameraDoesNotExist() {
        when(cameraRepository.existsById("MISSING")).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> cameraService.delete("MISSING"));
        verify(cameraRepository, never()).deleteById(any());
    }
}
