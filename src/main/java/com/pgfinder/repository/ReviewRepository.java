package com.pgfinder.repository;

import com.pgfinder.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {

    List<Review> findByPgIdOrderByCreatedAtDesc(String pgId);

    boolean existsByPgIdAndAuthorId(String pgId, String authorId);
}
