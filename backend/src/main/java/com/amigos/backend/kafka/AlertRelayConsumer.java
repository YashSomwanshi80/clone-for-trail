package com.amigos.backend.kafka;

import com.amigos.backend.alert.Alert;
import com.amigos.backend.alert.AlertWebSocketHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AlertRelayConsumer {

    private final AlertWebSocketHandler webSocketHandler;

    public AlertRelayConsumer(AlertWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @KafkaListener(topics = KafkaTopics.ALERTS, groupId = "alert-ws-relay")
    public void onAlert(Alert alert) {
        webSocketHandler.broadcast(alert);
    }
}
