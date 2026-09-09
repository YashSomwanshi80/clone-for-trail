package com.amigos.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class InternalApiKeyFilter extends OncePerRequestFilter {

    @Value("${anpr.internal-api-key}")
    private String expectedApiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getRequestURI().startsWith("/api/internal/")) {
            String providedKey = request.getHeader("X-Internal-Api-Key");
            if (providedKey == null || !providedKey.equals(expectedApiKey)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Invalid or missing internal API key");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }
}
