package com.amigos.backend.config;

import com.amigos.backend.auth.JwtAuthFilter;
import com.amigos.backend.security.InternalApiKeyFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final InternalApiKeyFilter internalApiKeyFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, InternalApiKeyFilter internalApiKeyFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.internalApiKeyFilter = internalApiKeyFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .ignoringRequestMatchers("/api/internal/**") // internal service calls use API key, not CSRF
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/ws/**").permitAll() // WS handshake auth is a separate concern, not covered yet
                .requestMatchers("/api/internal/**").permitAll() // InternalApiKeyFilter guards this instead
                .anyRequest().authenticated()
            )
            .addFilterBefore(internalApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
