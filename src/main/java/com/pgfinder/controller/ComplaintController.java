package com.pgfinder.controller;

import com.pgfinder.dto.ApiDtos.ComplaintCreateRequest;
import com.pgfinder.dto.ApiDtos.ComplaintDto;
import com.pgfinder.dto.ApiDtos.ComplaintUpdateRequest;
import com.pgfinder.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping("/api/complaints")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('USER', 'OWNER', 'ADMIN')")
    public ComplaintDto create(Authentication authentication, @Valid @RequestBody ComplaintCreateRequest request) {
        return complaintService.create(authentication.getName(), request);
    }

    @GetMapping("/api/complaints/my")
    @PreAuthorize("hasAnyRole('USER', 'OWNER', 'ADMIN')")
    public List<ComplaintDto> mine(Authentication authentication) {
        return complaintService.myComplaints(authentication.getName());
    }

    @GetMapping("/api/owner/complaints")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public List<ComplaintDto> ownerComplaints(Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        return complaintService.ownerComplaints(authentication.getName(), admin);
    }

    @PatchMapping("/api/owner/complaints/{complaintId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ComplaintDto update(Authentication authentication, @PathVariable String complaintId,
                               @Valid @RequestBody ComplaintUpdateRequest request) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        return complaintService.update(complaintId, authentication.getName(), admin, request);
    }
}
