package com.pgfinder.repository;

import com.pgfinder.model.LoginToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface LoginTokenRepository extends JpaRepository<LoginToken, String> {

    Optional<LoginToken> findByTokenHashAndExpiresAtAfter(String tokenHash, Instant now);

    void deleteByExpiresAtBefore(Instant now);
}
