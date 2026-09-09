package com.amigos.backend.kafka;

import com.amigos.backend.analytics.AnalyticsWebSocketHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AnalyticsRelayConsumer {

    private final AnalyticsWebSocketHandler webSocketHandler;

    public AnalyticsRelayConsumer(AnalyticsWebSocketHandler webSocketHandler) {
        this.webSocketHandler = webSocketHandler;
    }

    @KafkaListener(topics = KafkaTopics.ANALYTICS_AGGREGATES, groupId = "analytics-ws-relay")
    public void onUpdate(AnalyticsUpdateEvent event) {
        webSocketHandler.broadcast(event);
    }
}
