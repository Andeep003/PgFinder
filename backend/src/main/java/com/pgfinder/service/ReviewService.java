package com.pgfinder.service;

import com.pgfinder.dto.ApiDtos.ReviewDto;
import com.pgfinder.dto.ApiDtos.ReviewWriteRequest;
import com.pgfinder.exception.ApiException;
import com.pgfinder.exception.NotFoundException;
import com.pgfinder.model.Pg;
import com.pgfinder.model.Review;
import com.pgfinder.model.UserAccount;
import com.pgfinder.repository.PgRepository;
import com.pgfinder.repository.BookingRepository;
import com.pgfinder.repository.ReviewRepository;
import com.pgfinder.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ReviewService {

    private final ReviewRepository reviews;
    private final PgRepository pgs;
    private final UserAccountRepository users;
    private final BookingRepository bookings;

    public ReviewService(ReviewRepository reviews, PgRepository pgs, UserAccountRepository users,
                         BookingRepository bookings) {
        this.reviews = reviews;
        this.pgs = pgs;
        this.users = users;
        this.bookings = bookings;
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> list(String pgId) {
        Pg pg = pgs.findById(pgId).orElseThrow(() -> new NotFoundException("PG not found: " + pgId));
        if (!"approved".equals(pg.getStatus())) {
            throw new NotFoundException("PG not found: " + pgId);
        }
        return reviews.findByPgIdOrderByCreatedAtDesc(pgId).stream().map(ReviewDto::from).toList();
    }

    @Transactional
    public ReviewDto create(String pgId, String authorId, ReviewWriteRequest request) {
        Pg pg = pgs.findById(pgId).orElseThrow(() -> new NotFoundException("PG not found: " + pgId));
        if (!"approved".equals(pg.getStatus())) {
            throw new NotFoundException("PG not found: " + pgId);
        }
        if (reviews.existsByPgIdAndAuthorId(pgId, authorId)) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already reviewed this PG");
        }
        if (!bookings.existsByGuestIdAndBedRoomPgIdAndStatus(authorId, pgId, "confirmed")) {
            throw new ApiException(HttpStatus.FORBIDDEN, "A confirmed booking is required to review this PG");
        }
        UserAccount author = users.findById(authorId)
                .orElseThrow(() -> new NotFoundException("User not found: " + authorId));
        Review review = new Review();
        review.setId("review-" + UUID.randomUUID());
        review.setPg(pg);
        review.setAuthor(author);
        apply(review, request);
        return ReviewDto.from(reviews.save(review));
    }

    @Transactional
    public ReviewDto update(String reviewId, String authorId, ReviewWriteRequest request) {
        Review review = reviews.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found: " + reviewId));
        requireAuthor(review, authorId);
        apply(review, request);
        return ReviewDto.from(review);
    }

    @Transactional
    public void delete(String reviewId, String authorId) {
        Review review = reviews.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found: " + reviewId));
        requireAuthor(review, authorId);
        reviews.delete(review);
    }

    private static void apply(Review review, ReviewWriteRequest request) {
        review.setRating(request.rating());
        review.setComment(request.comment());
    }

    private static void requireAuthor(Review review, String authorId) {
        if (!review.getAuthor().getId().equals(authorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only manage your own reviews");
        }
    }
}
