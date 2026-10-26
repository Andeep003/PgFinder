package com.pgfinder.repository;

import com.pgfinder.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByGuestIdOrderByCreatedAtDesc(String guestId);

    List<Booking> findByBedRoomPgOwnerIdOrderByCreatedAtDesc(String ownerId);

    List<Booking> findByBedIdAndStatusOrderByStartDateAsc(Long bedId, String status);

    boolean existsByBedId(Long bedId);

    boolean existsByGuestIdAndBedRoomPgIdAndStatus(String guestId, String pgId, String status);

    @Query("select count(b) > 0 from Booking b where b.bed.id = :bedId and b.status <> 'cancelled' "
            + "and b.startDate < :endDate and b.endDate > :startDate")
    boolean existsOverlapping(@Param("bedId") Long bedId, @Param("startDate") LocalDate startDate,
                              @Param("endDate") LocalDate endDate);

    @Query("select count(b) > 0 from Booking b where b.bed.id = :bedId and b.status <> 'cancelled'")
    boolean hasActiveBooking(@Param("bedId") Long bedId);
}
