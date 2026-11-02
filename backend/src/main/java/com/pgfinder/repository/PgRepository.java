package com.pgfinder.repository;

import com.pgfinder.model.Pg;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** Spring writes the SQL for these methods from their names. */
public interface PgRepository extends JpaRepository<Pg, String> {

    List<Pg> findByStatus(String status);

    List<Pg> findByOwnerIdOrderByCreatedAtDesc(String ownerId);

    Optional<Pg> findByIdAndOwnerId(String id, String ownerId);
}
