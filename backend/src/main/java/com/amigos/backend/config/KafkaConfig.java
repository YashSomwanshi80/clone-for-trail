package com.amigos.backend.config;

import com.amigos.backend.kafka.KafkaTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Bean
    public NewTopic detectionEventsTopic() {
        return TopicBuilder.name(KafkaTopics.DETECTION_EVENTS)
            .partitions(1) // local dev; revisit partition count for multi-city (see SRS §5.3/§9)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic alertsTopic() {
        return TopicBuilder.name(KafkaTopics.ALERTS).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic analyticsAggregatesTopic() {
        return TopicBuilder.name(KafkaTopics.ANALYTICS_AGGREGATES).partitions(1).replicas(1).build();
    }
}
