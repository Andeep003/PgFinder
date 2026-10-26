package com.pgfinder.dto;

import com.pgfinder.model.Bed;
import com.pgfinder.model.Pg;
import com.pgfinder.model.Room;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * The JSON shapes the API sends back. Entities stay inside the backend; controllers return these
 * records, so the database layout can change without breaking the frontend. Field names match
 * what the React pages already read (pg.rooms[].beds[].status, rentPerBed, ...).
 */
public final class PgDtos {

    private PgDtos() {
    }

    public record BedDto(String bedNo, String status, String bookingId) {
        public static BedDto from(Bed b) {
            return new BedDto(b.getBedNo(), b.getStatus(), b.getBookingId());
        }
    }

    public record RoomDto(String id, String roomNo, int floor, int sharing, String type, boolean ac,
                          boolean attachedBathroom, int rentPerBed, List<BedDto> beds) {
        public static RoomDto from(Room r) {
            return new RoomDto(r.getId(), r.getRoomNo(), r.getFloor(), r.getSharing(), r.getType(), r.isAc(),
                    r.isAttachedBathroom(), r.getRentPerBed(), r.getBeds().stream().map(BedDto::from).toList());
        }
    }

    /** Same numbers as pgStats() in the frontend's db.js. */
    public record PgStats(int totalBeds, int available, int occupied, int booked, int minRent, int maxRent) {
        public static PgStats of(Pg pg) {
            List<Bed> beds = pg.getRooms().stream().flatMap(r -> r.getBeds().stream()).toList();
            List<Integer> rents = pg.getRooms().stream().map(Room::getRentPerBed).toList();
            return new PgStats(
                    beds.size(),
                    count(beds, "available"),
                    count(beds, "occupied"),
                    count(beds, "booked"),
                    rents.stream().mapToInt(Integer::intValue).min().orElse(0),
                    rents.stream().mapToInt(Integer::intValue).max().orElse(0));
        }

        private static int count(List<Bed> beds, String status) {
            return (int) beds.stream().filter(b -> status.equals(b.getStatus())).count();
        }
    }

    /** One card in the search results (GET /api/pgs). */
    public record PgSummary(String id, String name, String gender, String address, String locality, String city,
                            double lat, double lng, List<String> amenities, List<String> images,
                            List<Integer> sharingOptions, PgStats stats, Double distanceKm) {
        public static PgSummary from(Pg pg, Double distanceKm) {
            List<Integer> sharing = pg.getRooms().stream().map(Room::getSharing).distinct().sorted().toList();
            return new PgSummary(pg.getId(), pg.getName(), pg.getGender(), pg.getAddress(), pg.getLocality(),
                    pg.getCity(), pg.getLat(), pg.getLng(), List.copyOf(pg.getAmenities()),
                    List.copyOf(pg.getImages()), sharing, PgStats.of(pg), distanceKm);
        }
    }

    /** Full PG page with every room and bed (GET /api/pgs/{id}). */
    public record PgDetail(String id, String ownerId, String name, String gender, String address, String locality,
                           String city, double lat, double lng, String phone, String description,
                           List<String> amenities, List<String> rules, List<String> images,
                           Map<String, Map<String, String>> foodMenu, int depositMonths, String status,
                           LocalDate createdAt, List<RoomDto> rooms, PgStats stats) {
        public static PgDetail from(Pg pg) {
            return new PgDetail(pg.getId(), pg.getOwnerId(), pg.getName(), pg.getGender(), pg.getAddress(),
                    pg.getLocality(), pg.getCity(), pg.getLat(), pg.getLng(), pg.getPhone(), pg.getDescription(),
                    List.copyOf(pg.getAmenities()), List.copyOf(pg.getRules()), List.copyOf(pg.getImages()),
                    pg.getFoodMenu(), pg.getDepositMonths(), pg.getStatus(), pg.getCreatedAt(),
                    pg.getRooms().stream().map(RoomDto::from).toList(), PgStats.of(pg));
        }
    }
}
