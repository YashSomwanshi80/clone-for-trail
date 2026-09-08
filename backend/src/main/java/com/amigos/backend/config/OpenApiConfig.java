package com.amigos.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("ANPR Platform API")
                .version("1.0")
                .description("City-Wide ANPR Trajectory Tracking and Traffic Analytics — Java Backend"));
    }
}
