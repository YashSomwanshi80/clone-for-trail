package com.amigos.backend.config;

import com.amigos.backend.alert.AlertWebSocketHandler;
import com.amigos.backend.analytics.AnalyticsWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final AlertWebSocketHandler alertWebSocketHandler;
    private final AnalyticsWebSocketHandler analyticsWebSocketHandler;

    public WebSocketConfig(AlertWebSocketHandler alertWebSocketHandler,
                            AnalyticsWebSocketHandler analyticsWebSocketHandler) {
        this.alertWebSocketHandler = alertWebSocketHandler;
        this.analyticsWebSocketHandler = analyticsWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(alertWebSocketHandler, "/ws/alerts")
            .setAllowedOrigins("http://localhost:5173");
        registry.addHandler(analyticsWebSocketHandler, "/ws/analytics/live")
            .setAllowedOrigins("http://localhost:5173");
    }
}
