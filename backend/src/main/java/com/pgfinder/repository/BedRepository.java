package com.pgfinder.repository;

import com.pgfinder.model.Bed;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BedRepository extends JpaRepository<Bed, Long> {

    Optional<Bed> findByIdAndRoomIdAndRoomPgId(Long id, String roomId, String pgId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Bed b where b.id = :id")
    Optional<Bed> findByIdForUpdate(@Param("id") Long id);
}
