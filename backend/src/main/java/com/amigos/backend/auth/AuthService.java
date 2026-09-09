package com.amigos.backend.auth;

import com.amigos.backend.auth.dto.AuthResponse;
import com.amigos.backend.auth.dto.LoginRequest;
import com.amigos.backend.user.User;
import com.amigos.backend.user.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AuthService {

    private static final String REFRESH_KEY_PREFIX = "refresh_token:";

    @Value("${anpr.refresh-token-expiration-days:7}")
    private long refreshTokenExpirationDays;

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserService userService, JwtTokenProvider jwtTokenProvider,
                        RedisTemplate<String, String> redisTemplate) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.redisTemplate = redisTemplate;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userService.loadByUsername(request.username());

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        return issueTokens(user.getUsername());
    }

    public AuthResponse refresh(String refreshToken) {
        String redisKey = REFRESH_KEY_PREFIX + refreshToken;
        String username = redisTemplate.opsForValue().get(redisKey);

        if (username == null) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        // rotate: invalidate the old refresh token, issue a fresh pair
        redisTemplate.delete(redisKey);
        return issueTokens(username);
    }

    public void logout(String refreshToken) {
        redisTemplate.delete(REFRESH_KEY_PREFIX + refreshToken);
        // NOTE: the access token tied to this session remains valid until its own
        // short expiry elapses — this is a known, accepted limitation (stateless
        // access tokens), not an oversight. See conversation note.
    }

    private AuthResponse issueTokens(String username) {
        String accessToken = jwtTokenProvider.generateToken(username);
        String refreshToken = jwtTokenProvider.generateOpaqueRefreshToken();

        redisTemplate.opsForValue().set(
            REFRESH_KEY_PREFIX + refreshToken,
            username,
            Duration.ofDays(refreshTokenExpirationDays)
        );

        return new AuthResponse(accessToken, refreshToken, "Bearer");
    }
}
