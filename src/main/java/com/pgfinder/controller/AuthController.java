package com.pgfinder.controller;

import com.pgfinder.dto.ApiDtos.AuthResponse;
import com.pgfinder.dto.ApiDtos.LoginRequest;
import com.pgfinder.dto.ApiDtos.RegisterRequest;
import com.pgfinder.dto.ApiDtos.UserDto;
import com.pgfinder.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserDto me(Authentication authentication) {
        return authService.getUser(authentication.getName());
    }
}
