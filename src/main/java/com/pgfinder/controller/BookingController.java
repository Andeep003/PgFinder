package com.pgfinder.controller;

import com.pgfinder.dto.ApiDtos.AvailabilityDto;
import com.pgfinder.dto.ApiDtos.BookingDto;
import com.pgfinder.dto.ApiDtos.BookingRequest;
import com.pgfinder.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/api/pgs/{pgId}/availability")
    public AvailabilityDto availability(@PathVariable String pgId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return bookingService.availability(pgId, startDate, endDate);
    }

    @PostMapping("/api/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('USER')")
    public BookingDto create(Authentication authentication, @Valid @RequestBody BookingRequest request) {
        return bookingService.create(authentication.getName(), request);
    }

    @GetMapping("/api/bookings/my")
    @PreAuthorize("hasRole('USER')")
    public List<BookingDto> myBookings(Authentication authentication) {
        return bookingService.guestBookings(authentication.getName());
    }

    @GetMapping("/api/owner/bookings")
    @PreAuthorize("hasRole('OWNER')")
    public List<BookingDto> ownerBookings(Authentication authentication) {
        return bookingService.ownerBookings(authentication.getName());
    }

    @PatchMapping("/api/bookings/{bookingId}/cancel")
    @PreAuthorize("hasAnyRole('USER', 'OWNER', 'ADMIN')")
    public BookingDto cancel(Authentication authentication, @PathVariable String bookingId) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        return bookingService.cancel(authentication.getName(), admin, bookingId);
    }
}
