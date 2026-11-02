package com.pgfinder.repository;

import com.pgfinder.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, String> {

    Optional<Room> findByIdAndPgId(String id, String pgId);
}
