package com.amigos.backend.camera;

import com.amigos.backend.auth.JwtTokenProvider;
import com.amigos.backend.camera.dto.CameraResponse;
import tools.jackson.databind.json.JsonMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CameraController.class)
@AutoConfigureMockMvc(addFilters = false)
class CameraControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper objectMapper;

    @MockitoBean
    private CameraService cameraService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider; // satisfies JwtAuthFilter's constructor dependency

    @Test
    void getOne_returnsCameraJson() throws Exception {
        CameraResponse response = new CameraResponse("CAM001", "pilot-city-1", "pilot-state-1", 28.6139, 77.2090, "N", "ACTIVE");
        when(cameraService.findById("CAM001")).thenReturn(response);

        mockMvc.perform(get("/api/v1/cameras/CAM001"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.cameraId").value("CAM001"))
            .andExpect(jsonPath("$.cityId").value("pilot-city-1"));
    }

    @Test
    void list_returnsAllCamerasWhenNoCityFilter() throws Exception {
        when(cameraService.findAll()).thenReturn(List.of(
            new CameraResponse("CAM001", "pilot-city-1", "pilot-state-1", 28.6139, 77.2090, "N", "ACTIVE")
        ));

        mockMvc.perform(get("/api/v1/cameras"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].cameraId").value("CAM001"));
    }

    @Test
    void create_rejectsInvalidRequest_missingRequiredFields() throws Exception {
        String invalidJson = "{\"cameraId\":\"\"}";

        mockMvc.perform(post("/api/v1/cameras")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }
}
