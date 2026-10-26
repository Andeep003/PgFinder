package com.pgfinder.dto;

import com.pgfinder.model.Booking;
import com.pgfinder.model.Complaint;
import com.pgfinder.model.Pg;
import com.pgfinder.model.Review;
import com.pgfinder.model.UserAccount;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class ApiDtos {

    private ApiDtos() {
    }

    public record RegisterRequest(@NotBlank @Size(max = 120) String name,
                                  @NotBlank @Email @Size(max = 254) String email,
                                  @NotBlank @Size(min = 8, max = 72) String password,
                                  @Size(max = 40) String phone,
                                  String role) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record UserDto(String id, String name, String email, String phone, String role, String status,
                          Instant createdAt) {
        public static UserDto from(UserAccount user) {
            return new UserDto(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole(),
                    user.getStatus(), user.getCreatedAt());
        }
    }

    public record AuthResponse(String token, String tokenType, Instant expiresAt, UserDto user) {
    }

    public record PgWriteRequest(@NotBlank @Size(max = 160) String name,
                                 @NotBlank String gender,
                                 @NotBlank @Size(max = 300) String address,
                                 @NotBlank @Size(max = 120) String locality,
                                 @NotBlank @Size(max = 120) String city,
                                 @DecimalMin("-90.0") @DecimalMax("90.0") double lat,
                                 @DecimalMin("-180.0") @DecimalMax("180.0") double lng,
                                 @NotBlank @Size(max = 40) String phone,
                                 @Size(max = 2000) String description,
                                 List<String> amenities, List<String> rules, List<String> images,
                                 Map<String, Map<String, String>> foodMenu,
                                 @Min(0) @Max(24) int depositMonths) {
    }

    public record RoomWriteRequest(@NotBlank @Size(max = 30) String roomNo,
                                   @Min(0) @Max(200) int floor,
                                   @Min(1) @Max(4) int sharing,
                                   @NotBlank @Size(max = 50) String type,
                                   boolean ac, boolean attachedBathroom,
                                   @Positive int rentPerBed) {
    }

    public record BedWriteRequest(@NotBlank @Size(max = 20) String bedNo,
                                  @NotBlank String status) {
    }

    public record BookingRequest(@NotNull Long bedId,
                                 @NotNull LocalDate startDate,
                                 @NotNull LocalDate endDate) {
    }

    public record BookingDto(String id, Long bedId, String bedNo, String roomId, String pgId, String pgName,
                             LocalDate startDate, LocalDate endDate, String status, Instant createdAt,
                             String guestId, String guestName) {
        public static BookingDto from(Booking booking) {
            return new BookingDto(booking.getId(), booking.getBed().getId(), booking.getBed().getBedNo(),
                    booking.getBed().getRoom().getId(), booking.getBed().getRoom().getPg().getId(),
                    booking.getBed().getRoom().getPg().getName(), booking.getStartDate(), booking.getEndDate(),
                    booking.getStatus(), booking.getCreatedAt(), booking.getGuest().getId(),
                    booking.getGuest().getName());
        }
    }

    public record ReviewWriteRequest(@Min(1) @Max(5) int rating, @Size(max = 2000) String comment) {
    }

    public record ReviewDto(String id, String pgId, String authorId, String authorName, int rating, String comment,
                            Instant createdAt) {
        public static ReviewDto from(Review review) {
            return new ReviewDto(review.getId(), review.getPg().getId(), review.getAuthor().getId(),
                    review.getAuthor().getName(), review.getRating(), review.getComment(), review.getCreatedAt());
        }
    }

    public record ComplaintCreateRequest(@NotBlank String pgId,
                                         @NotBlank @Size(max = 160) String subject,
                                         @NotBlank @Size(max = 4000) String description) {
    }

    public record ComplaintUpdateRequest(@NotBlank String status, @Size(max = 4000) String response) {
    }

    public record ComplaintDto(String id, String pgId, String pgName, String authorId, String authorName,
                               String subject, String description, String response, String status,
                               Instant createdAt, Instant updatedAt) {
        public static ComplaintDto from(Complaint complaint) {
            return new ComplaintDto(complaint.getId(), complaint.getPg().getId(), complaint.getPg().getName(),
                    complaint.getAuthor().getId(), complaint.getAuthor().getName(), complaint.getSubject(),
                    complaint.getDescription(), complaint.getResponse(), complaint.getStatus(),
                    complaint.getCreatedAt(), complaint.getUpdatedAt());
        }
    }

    public record StatusRequest(@NotBlank String status) {
    }

    public record ImageDto(String id, String url, String contentType, Instant createdAt) {
    }

    public record AvailabilityDto(String pgId, LocalDate startDate, LocalDate endDate,
                                  List<AvailabilityRoomDto> rooms) {
    }

    public record AvailabilityRoomDto(String roomId, String roomNo, int sharing, int rentPerBed,
                                      List<AvailabilityBedDto> beds) {
    }

    public record AvailabilityBedDto(Long bedId, String bedNo, boolean available) {
    }

    public record PgStatusDto(String id, String name, String ownerId, String status) {
        public static PgStatusDto from(Pg pg) {
            return new PgStatusDto(pg.getId(), pg.getName(), pg.getOwnerId(), pg.getStatus());
        }
    }
}
