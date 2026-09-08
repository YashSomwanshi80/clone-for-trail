package com.amigos.backend.kafka;

public final class KafkaTopics {
    public static final String DETECTION_EVENTS = "anpr.detection.events";
    public static final String ALERTS = "anpr.alerts";
    public static final String ANALYTICS_AGGREGATES = "anpr.analytics.aggregates";

    private KafkaTopics() {} // no instances — constants only
}
