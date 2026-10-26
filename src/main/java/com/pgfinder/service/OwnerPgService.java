package com.pgfinder.service;

import com.pgfinder.dto.ApiDtos.BedWriteRequest;
import com.pgfinder.dto.ApiDtos.PgStatusDto;
import com.pgfinder.dto.ApiDtos.PgWriteRequest;
import com.pgfinder.dto.ApiDtos.RoomWriteRequest;
import com.pgfinder.dto.PgDtos.PgDetail;
import com.pgfinder.exception.ApiException;
import com.pgfinder.exception.NotFoundException;
import com.pgfinder.model.Bed;
import com.pgfinder.model.Pg;
import com.pgfinder.model.Room;
import com.pgfinder.repository.BedRepository;
import com.pgfinder.repository.BookingRepository;
import com.pgfinder.repository.PgRepository;
import com.pgfinder.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class OwnerPgService {

    private final PgRepository pgs;
    private final RoomRepository rooms;
    private final BedRepository beds;
    private final BookingRepository bookings;

    public OwnerPgService(PgRepository pgs, RoomRepository rooms, BedRepository beds, BookingRepository bookings) {
        this.pgs = pgs;
        this.rooms = rooms;
        this.beds = beds;
        this.bookings = bookings;
    }

    @Transactional(readOnly = true)
    public List<PgDetail> listOwned(String ownerId) {
        return pgs.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream().map(PgDetail::from).toList();
    }

    @Transactional(readOnly = true)
    public PgDetail getOwned(String ownerId, String pgId) {
        return PgDetail.from(ownedPg(ownerId, pgId));
    }

    @Transactional
    public PgDetail create(String ownerId, PgWriteRequest request) {
        Pg pg = new Pg();
        pg.setId("pg-" + UUID.randomUUID());
        pg.setOwnerId(ownerId);
        pg.setCreatedAt(LocalDate.now());
        apply(pg, request);
        pg.setStatus("pending");
        return PgDetail.from(pgs.save(pg));
    }

    @Transactional
    public PgDetail update(String ownerId, String pgId, PgWriteRequest request) {
        Pg pg = ownedPg(ownerId, pgId);
        apply(pg, request);
        pg.setStatus("pending");
        return PgDetail.from(pg);
    }

    @Transactional
    public void delete(String ownerId, String pgId) {
        Pg pg = ownedPg(ownerId, pgId);
        pg.setStatus("disabled");
    }

    @Transactional
    public String addRoom(String ownerId, String pgId, RoomWriteRequest request) {
        Pg pg = ownedPg(ownerId, pgId);
        Room room = new Room();
        room.setId("room-" + UUID.randomUUID());
        apply(room, request);
        pg.addRoom(room);
        rooms.save(room);
        return room.getId();
    }

    @Transactional
    public void updateRoom(String ownerId, String pgId, String roomId, RoomWriteRequest request) {
        ownedPg(ownerId, pgId);
        Room room = rooms.findByIdAndPgId(roomId, pgId)
                .orElseThrow(() -> new NotFoundException("Room not found: " + roomId));
        if (room.getBeds().size() > request.sharing()) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot reduce room sharing below its existing bed count");
        }
        apply(room, request);
    }

    @Transactional
    public void deleteRoom(String ownerId, String pgId, String roomId) {
        ownedPg(ownerId, pgId);
        Room room = rooms.findByIdAndPgId(roomId, pgId)
                .orElseThrow(() -> new NotFoundException("Room not found: " + roomId));
        for (Bed bed : room.getBeds()) {
            if (bookings.existsByBedId(bed.getId())) {
                throw new ApiException(HttpStatus.CONFLICT, "Cannot delete a room with booking history");
            }
        }
        rooms.delete(room);
    }

    @Transactional
    public Bed addBed(String ownerId, String pgId, String roomId, BedWriteRequest request) {
        ownedPg(ownerId, pgId);
        Room room = rooms.findByIdAndPgId(roomId, pgId)
                .orElseThrow(() -> new NotFoundException("Room not found: " + roomId));
        if (room.getBeds().size() >= room.getSharing()) {
            throw new ApiException(HttpStatus.CONFLICT, "This room already has its maximum number of beds");
        }
        validateBedStatus(request.status());
        Bed bed = new Bed(request.bedNo().trim(), normalizeBedStatus(request.status()));
        room.addBed(bed);
        return beds.save(bed);
    }

    @Transactional
    public Bed updateBed(String ownerId, String pgId, String roomId, Long bedId, BedWriteRequest request) {
        ownedPg(ownerId, pgId);
        Bed bed = beds.findByIdAndRoomIdAndRoomPgId(bedId, roomId, pgId)
                .orElseThrow(() -> new NotFoundException("Bed not found: " + bedId));
        validateBedStatus(request.status());
        if (bookings.hasActiveBooking(bedId) && !normalizeBedStatus(request.status()).equals(bed.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot change the status of a bed with an active booking");
        }
        bed.setBedNo(request.bedNo().trim());
        bed.setStatus(normalizeBedStatus(request.status()));
        if (!"booked".equals(bed.getStatus())) {
            bed.setBookingId(null);
        }
        return bed;
    }

    @Transactional
    public void deleteBed(String ownerId, String pgId, String roomId, Long bedId) {
        ownedPg(ownerId, pgId);
        Bed bed = beds.findByIdAndRoomIdAndRoomPgId(bedId, roomId, pgId)
                .orElseThrow(() -> new NotFoundException("Bed not found: " + bedId));
        if (bookings.existsByBedId(bedId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot delete a bed with booking history");
        }
        beds.delete(bed);
    }

    @Transactional(readOnly = true)
    public List<PgStatusDto> adminPgs(String status) {
        List<Pg> result = status == null || status.isBlank()
                ? pgs.findAll()
                : pgs.findByStatus(status.trim().toLowerCase(Locale.ROOT));
        return result.stream().map(PgStatusDto::from).toList();
    }

    @Transactional
    public PgStatusDto updatePgStatus(String pgId, String status) {
        Pg pg = pgs.findById(pgId).orElseThrow(() -> new NotFoundException("PG not found: " + pgId));
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        if (!List.of("pending", "approved", "rejected", "disabled").contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PG status must be pending, approved, rejected, or disabled");
        }
        pg.setStatus(normalized);
        return PgStatusDto.from(pg);
    }

    private Pg ownedPg(String ownerId, String pgId) {
        return pgs.findByIdAndOwnerId(pgId, ownerId)
                .orElseThrow(() -> new NotFoundException("PG not found: " + pgId));
    }

    private static void apply(Pg pg, PgWriteRequest request) {
        if (!List.of("Boys", "Girls", "Co-living").contains(request.gender().trim())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Gender must be Boys, Girls, or Co-living");
        }
        pg.setName(request.name().trim());
        pg.setGender(request.gender().trim());
        pg.setAddress(request.address().trim());
        pg.setLocality(request.locality().trim());
        pg.setCity(request.city().trim());
        pg.setLat(request.lat());
        pg.setLng(request.lng());
        pg.setPhone(request.phone().trim());
        pg.setDescription(request.description());
        pg.setAmenities(request.amenities() == null ? new ArrayList<>() : new ArrayList<>(request.amenities()));
        pg.setRules(request.rules() == null ? new ArrayList<>() : new ArrayList<>(request.rules()));
        pg.setImages(request.images() == null ? new ArrayList<>() : new ArrayList<>(request.images()));
        pg.setFoodMenu(request.foodMenu() == null ? Map.of() : request.foodMenu());
        pg.setDepositMonths(request.depositMonths());
    }

    private static void apply(Room room, RoomWriteRequest request) {
        room.setRoomNo(request.roomNo().trim());
        room.setFloor(request.floor());
        room.setSharing(request.sharing());
        room.setType(request.type().trim());
        room.setAc(request.ac());
        room.setAttachedBathroom(request.attachedBathroom());
        room.setRentPerBed(request.rentPerBed());
    }

    private static String normalizeBedStatus(String status) {
        return status.trim().toLowerCase(Locale.ROOT);
    }

    private static void validateBedStatus(String status) {
        if (!List.of("available", "booked", "occupied", "maintenance")
                .contains(normalizeBedStatus(status))) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Bed status must be available, booked, occupied, or maintenance");
        }
    }
}
