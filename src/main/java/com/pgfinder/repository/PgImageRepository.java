package com.pgfinder.repository;

import com.pgfinder.model.PgImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PgImageRepository extends JpaRepository<PgImage, String> {

    Optional<PgImage> findByIdAndPgId(String id, String pgId);
}
