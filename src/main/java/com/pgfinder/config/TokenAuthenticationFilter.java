package com.pgfinder.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pgfinder.exception.ApiException;
import com.pgfinder.service.AuthService;
import com.pgfinder.service.AuthService.TokenIdentity;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public TokenAuthenticationFilter(AuthService authService, ObjectMapper objectMapper) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                TokenIdentity identity = authService.identify(header.substring(7).trim());
                var authentication = new UsernamePasswordAuthenticationToken(identity.userId(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + identity.role())));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (ApiException e) {
                SecurityContextHolder.clearContext();
                response.setStatus(e.getStatus().value());
                response.setContentType("application/json");
                objectMapper.writeValue(response.getOutputStream(), Map.of(
                        "status", e.getStatus().value(), "error", e.getMessage(), "timestamp", Instant.now().toString()));
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
