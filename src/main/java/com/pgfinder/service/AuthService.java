package com.pgfinder.service;

import com.pgfinder.dto.ApiDtos.AuthResponse;
import com.pgfinder.dto.ApiDtos.LoginRequest;
import com.pgfinder.dto.ApiDtos.RegisterRequest;
import com.pgfinder.dto.ApiDtos.UserDto;
import com.pgfinder.exception.ApiException;
import com.pgfinder.exception.NotFoundException;
import com.pgfinder.model.LoginToken;
import com.pgfinder.model.UserAccount;
import com.pgfinder.repository.LoginTokenRepository;
import com.pgfinder.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserAccountRepository users;
    private final LoginTokenRepository tokens;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository users, LoginTokenRepository tokens, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.tokens = tokens;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        String role = request.role() == null || request.role().isBlank()
                ? "USER" : request.role().trim().toUpperCase(Locale.ROOT);
        if (!role.equals("USER") && !role.equals("OWNER")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role must be USER or OWNER");
        }
        UserAccount user = new UserAccount();
        user.setId("u-" + UUID.randomUUID());
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone() == null ? null : request.phone().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setStatus("active");
        user = users.save(user);
        return issueToken(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserAccount user = users.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        if (!"active".equals(user.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account is not active");
        }
        tokens.deleteByExpiresAtBefore(Instant.now());
        return issueToken(user);
    }

    @Transactional(readOnly = true)
    public TokenIdentity identify(String rawToken) {
        LoginToken token = tokens.findByTokenHashAndExpiresAtAfter(hashToken(rawToken), Instant.now())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired access token"));
        UserAccount user = token.getUser();
        if (!"active".equals(user.getStatus())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Account is not active");
        }
        return new TokenIdentity(user.getId(), user.getRole());
    }

    @Transactional(readOnly = true)
    public UserDto getUser(String id) {
        return UserDto.from(users.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id)));
    }

    @Transactional
    public void updateUserStatus(String id, String status) {
        UserAccount user = users.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        if (!normalized.equals("active") && !normalized.equals("suspended")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User status must be active or suspended");
        }
        user.setStatus(normalized);
    }

    private AuthResponse issueToken(UserAccount user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);
        tokens.save(new LoginToken(hashToken(rawToken), user, expiresAt));
        return new AuthResponse(rawToken, "Bearer", expiresAt, UserDto.from(user));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String hashToken(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    public record TokenIdentity(String userId, String role) {
    }
}
