package com.pgfinder.service;

import com.pgfinder.dto.ApiDtos.AvailabilityBedDto;
import com.pgfinder.dto.ApiDtos.AvailabilityDto;
import com.pgfinder.dto.ApiDtos.AvailabilityRoomDto;
import com.pgfinder.dto.ApiDtos.BookingDto;
import com.pgfinder.dto.ApiDtos.BookingRequest;
import com.pgfinder.dto.ApiDtos.VacateRequest;
import com.pgfinder.exception.ApiException;
import com.pgfinder.exception.NotFoundException;
import com.pgfinder.model.Bed;
import com.pgfinder.model.Booking;
import com.pgfinder.model.Pg;
import com.pgfinder.model.UserAccount;
import com.pgfinder.repository.BedRepository;
import com.pgfinder.repository.BookingRepository;
import com.pgfinder.repository.PgRepository;
import com.pgfinder.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class BookingService {

    private final BookingRepository bookings;
    private final BedRepository beds;
    private final PgRepository pgs;
    private final UserAccountRepository users;

    public BookingService(BookingRepository bookings, BedRepository beds, PgRepository pgs,
                         UserAccountRepository users) {
        this.bookings = bookings;
        this.beds = beds;
        this.pgs = pgs;
        this.users = users;
    }

    @Transactional
    public BookingDto create(String guestId, BookingRequest request) {
        if (!request.endDate().isAfter(request.startDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "endDate must be later than startDate");
        }
        if (request.startDate().isBefore(LocalDate.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "startDate cannot be in the past");
        }
        Bed bed = beds.findByIdForUpdate(request.bedId())
                .orElseThrow(() -> new NotFoundException("Bed not found: " + request.bedId()));
        Pg pg = bed.getRoom().getPg();
        if (!"approved".equals(pg.getStatus())) {
            throw new NotFoundException("PG not found: " + pg.getId());
        }
        List<Booking> currentBookings = activeBookingsForBed(bed.getId());
        if ("occupied".equals(bed.getStatus()) || "maintenance".equals(bed.getStatus())
                || ("booked".equals(bed.getStatus()) && currentBookings.isEmpty())
                || bookings.existsOverlapping(bed.getId(), request.startDate(), request.endDate())) {
            throw new ApiException(HttpStatus.CONFLICT, "Bed is not available for the requested dates");
        }
        UserAccount guest = users.findById(guestId)
                .orElseThrow(() -> new NotFoundException("User not found: " + guestId));
        Booking booking = new Booking();
        booking.setId("bk-" + UUID.randomUUID());
        booking.setBed(bed);
        booking.setGuest(guest);
        booking.setStartDate(request.startDate());
        booking.setEndDate(request.endDate());
        booking.setStatus("confirmed");
        Booking saved = bookings.save(booking);
        currentBookings = activeBookingsForBed(bed.getId());
        if (!currentBookings.isEmpty()) {
            bed.setStatus("booked");
            bed.setBookingId(currentBookings.get(0).getId());
        }
        return BookingDto.from(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> guestBookings(String guestId) {
        return bookings.findByGuestIdOrderByCreatedAtDesc(guestId).stream().map(BookingDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<BookingDto> ownerBookings(String ownerId) {
        return bookings.findByBedRoomPgOwnerIdOrderByCreatedAtDesc(ownerId).stream().map(BookingDto::from).toList();
    }

    @Transactional
    public BookingDto requestVacate(String guestId, String bookingId, VacateRequest request) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));
        if (!guestId.equals(booking.getGuest().getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot request to vacate this booking");
        }
        if (!"confirmed".equals(booking.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only an active booking can request to vacate");
        }
        if (request.vacateDate().isBefore(LocalDate.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "vacateDate cannot be in the past");
        }
        booking.setStatus("vacate_requested");
        booking.setVacateRequestedAt(Instant.now());
        booking.setVacateDate(request.vacateDate());
        return BookingDto.from(booking);
    }

    @Transactional
    public BookingDto confirmVacate(String ownerId, String bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));
        if (!ownerId.equals(booking.getBed().getRoom().getPg().getOwnerId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot confirm vacancy for this booking");
        }
        if (!"vacate_requested".equals(booking.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "This booking has no pending vacancy request");
        }
        booking.setStatus("vacated");
        Bed bed = booking.getBed();
        if (booking.getId().equals(bed.getBookingId())) {
            List<Booking> remaining = activeBookingsForBed(bed.getId());
            if (remaining.isEmpty()) {
                bed.setStatus("available");
                bed.setBookingId(null);
            } else {
                bed.setStatus("booked");
                bed.setBookingId(remaining.get(0).getId());
            }
        }
        return BookingDto.from(booking);
    }

    @Transactional
    public BookingDto cancel(String actorId, boolean admin, String bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));
        String ownerId = booking.getBed().getRoom().getPg().getOwnerId();
        if (!admin && !actorId.equals(booking.getGuest().getId()) && !actorId.equals(ownerId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot cancel this booking");
        }
        if ("cancelled".equals(booking.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Booking is already cancelled");
        }
        booking.setStatus("cancelled");
        Bed bed = booking.getBed();
        if (booking.getId().equals(bed.getBookingId())) {
            List<Booking> remaining = activeBookingsForBed(bed.getId());
            if (remaining.isEmpty()) {
                bed.setStatus("available");
                bed.setBookingId(null);
            } else {
                bed.setStatus("booked");
                bed.setBookingId(remaining.get(0).getId());
            }
        }
        return BookingDto.from(booking);
    }

    private List<Booking> activeBookingsForBed(Long bedId) {
        return bookings.findByBedIdAndStatusInOrderByStartDateAsc(
                bedId, List.of("confirmed", "vacate_requested"));
    }

    @Transactional(readOnly = true)
    public AvailabilityDto availability(String pgId, LocalDate startDate, LocalDate endDate) {
        Pg pg = pgs.findById(pgId).orElseThrow(() -> new NotFoundException("PG not found: " + pgId));
        if (!"approved".equals(pg.getStatus())) {
            throw new NotFoundException("PG not found: " + pgId);
        }
        if ((startDate == null) != (endDate == null)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "startDate and endDate must be provided together");
        }
        if (startDate != null && !endDate.isAfter(startDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "endDate must be later than startDate");
        }
        List<AvailabilityRoomDto> roomAvailability = pg.getRooms().stream().map(room ->
                new AvailabilityRoomDto(room.getId(), room.getRoomNo(), room.getSharing(), room.getRentPerBed(),
                        room.getBeds().stream().map(bed -> {
                            boolean currentlyFree = "available".equals(bed.getStatus())
                                    || (startDate != null && "booked".equals(bed.getStatus()));
                            boolean freeForDates = startDate == null || !bookings.existsOverlapping(
                                    bed.getId(), startDate, endDate);
                            return new AvailabilityBedDto(bed.getId(), bed.getBedNo(), currentlyFree && freeForDates);
                        }).toList())).toList();
        return new AvailabilityDto(pgId, startDate, endDate, roomAvailability);
    }
}
