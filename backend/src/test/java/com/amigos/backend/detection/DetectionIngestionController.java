package com.amigos.backend.detection;

import com.amigos.backend.detection.dto.DetectionEventRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DetectionIngestionController.class)
@AutoConfigureMockMvc(addFilters = false)
class DetectionIngestionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DetectionIngestionService ingestionService;

    @Test
    void ingestOne_acceptsValidDetectionEvent() throws Exception {
        DetectionEventRequest request = new DetectionEventRequest(
            "media-123", "CAM001", "DL01AB1234", 0.95,
            28.6139, 77.2090, "N", Instant.now(), "/media/crops/xyz.jpg", "v1.0"
        );

        mockMvc.perform(post("/api/internal/v1/detections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isAccepted());

        verify(ingestionService, times(1)).ingest(any(DetectionEventRequest.class));
    }

    @Test
    void ingestOne_rejectsMissingPlateNumber() throws Exception {
        String invalidJson = """
            {
              "mediaId": "media-123",
              "cameraId": "CAM001",
              "confidence": 0.95,
              "lat": 28.6139,
              "lng": 77.2090,
              "timestamp": "2026-09-09T10:00:00Z"
            }
            """;

        mockMvc.perform(post("/api/internal/v1/detections")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
            .andExpect(status().isBadRequest());
    }
}
