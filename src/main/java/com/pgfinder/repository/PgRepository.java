package com.pgfinder.repository;

import com.pgfinder.model.Pg;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** Spring writes the SQL for these methods from their names. */
public interface PgRepository extends JpaRepository<Pg, String> {

    List<Pg> findByStatus(String status);
}
