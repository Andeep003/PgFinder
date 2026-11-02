package com.pgfinder.controller;

import com.pgfinder.dto.ApiDtos.StatusRequest;
import com.pgfinder.dto.ApiDtos.UserDto;
import com.pgfinder.dto.ApiDtos.PgStatusDto;
import com.pgfinder.service.AuthService;
import com.pgfinder.service.OwnerPgService;
import com.pgfinder.repository.UserAccountRepository;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final OwnerPgService ownerPgService;
    private final AuthService authService;
    private final UserAccountRepository users;

    public AdminController(OwnerPgService ownerPgService, AuthService authService, UserAccountRepository users) {
        this.ownerPgService = ownerPgService;
        this.authService = authService;
        this.users = users;
    }

    @GetMapping("/pgs")
    public List<PgStatusDto> pgs(@RequestParam(required = false) String status) {
        return ownerPgService.adminPgs(status);
    }

    @PatchMapping("/pgs/{pgId}/status")
    public PgStatusDto updatePgStatus(@PathVariable String pgId, @Valid @RequestBody StatusRequest request) {
        return ownerPgService.updatePgStatus(pgId, request.status());
    }

    @GetMapping("/users")
    public List<UserDto> users() {
        return users.findAll().stream().map(UserDto::from).toList();
    }

    @PatchMapping("/users/{userId}/status")
    public UserDto updateUserStatus(@PathVariable String userId, @Valid @RequestBody StatusRequest request) {
        authService.updateUserStatus(userId, request.status());
        return authService.getUser(userId);
    }
}
