package com.amigos.backend.config;

import com.amigos.backend.alert.Alert;
import com.amigos.backend.kafka.DetectionPersistedEvent;
import com.amigos.backend.kafka.KafkaTopics;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public NewTopic detectionEventsTopic() {
        return TopicBuilder.name(KafkaTopics.DETECTION_EVENTS).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic alertsTopic() {
        return TopicBuilder.name(KafkaTopics.ALERTS).partitions(1).replicas(1).build();
    }

    @Bean
    public NewTopic analyticsAggregatesTopic() {
        return TopicBuilder.name(KafkaTopics.ANALYTICS_AGGREGATES).partitions(1).replicas(1).build();
    }

    private Map<String, Object> baseProducerConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return config;
    }

    @Bean
    public ProducerFactory<String, DetectionPersistedEvent> detectionEventProducerFactory() {
        return new DefaultKafkaProducerFactory<>(baseProducerConfig());
    }

    @Bean
    public KafkaTemplate<String, DetectionPersistedEvent> detectionEventKafkaTemplate() {
        return new KafkaTemplate<>(detectionEventProducerFactory());
    }

    @Bean
    public ProducerFactory<String, Alert> alertProducerFactory() {
        return new DefaultKafkaProducerFactory<>(baseProducerConfig());
    }

    @Bean
    public KafkaTemplate<String, Alert> alertKafkaTemplate() {
        return new KafkaTemplate<>(alertProducerFactory());
    }

    @Bean
    public ProducerFactory<String, AnalyticsUpdateEvent> analyticsUpdateProducerFactory() {
        return new DefaultKafkaProducerFactory<>(baseProducerConfig());
    }

    @Bean
    public KafkaTemplate<String, AnalyticsUpdateEvent> analyticsUpdateKafkaTemplate() {
        return new KafkaTemplate<>(analyticsUpdateProducerFactory());
    }
}
