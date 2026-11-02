package com.pgfinder.controller;

import com.pgfinder.dto.ApiDtos.ReviewDto;
import com.pgfinder.dto.ApiDtos.ReviewWriteRequest;
import com.pgfinder.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/api/pgs/{pgId}/reviews")
    public List<ReviewDto> list(@PathVariable String pgId) {
        return reviewService.list(pgId);
    }

    @PostMapping("/api/pgs/{pgId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('USER')")
    public ReviewDto create(Authentication authentication, @PathVariable String pgId,
                            @Valid @RequestBody ReviewWriteRequest request) {
        return reviewService.create(pgId, authentication.getName(), request);
    }

    @PutMapping("/api/reviews/{reviewId}")
    @PreAuthorize("hasRole('USER')")
    public ReviewDto update(Authentication authentication, @PathVariable String reviewId,
                            @Valid @RequestBody ReviewWriteRequest request) {
        return reviewService.update(reviewId, authentication.getName(), request);
    }

    @DeleteMapping("/api/reviews/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('USER')")
    public void delete(Authentication authentication, @PathVariable String reviewId) {
        reviewService.delete(reviewId, authentication.getName());
    }
}
