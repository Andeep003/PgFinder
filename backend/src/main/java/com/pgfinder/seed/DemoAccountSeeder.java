package com.pgfinder.seed;

import com.pgfinder.model.Bed;
import com.pgfinder.model.Booking;
import com.pgfinder.model.Pg;
import com.pgfinder.model.UserAccount;
import com.pgfinder.repository.BookingRepository;
import com.pgfinder.repository.PgRepository;
import com.pgfinder.repository.UserAccountRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@Profile("dev")
@Order(2)
public class DemoAccountSeeder implements CommandLineRunner {

    private final UserAccountRepository users;
    private final PgRepository pgs;
    private final BookingRepository bookings;
    private final PasswordEncoder passwordEncoder;

    public DemoAccountSeeder(UserAccountRepository users, PgRepository pgs,
                             BookingRepository bookings, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.pgs = pgs;
        this.bookings = bookings;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.count() == 0) {
            createUser("u-owner1", "Demo Owner One", "owner1@pgfinder.local", "OWNER");
            createUser("u-owner2", "Demo Owner Two", "owner2@pgfinder.local", "OWNER");
            createUser("u-owner3", "Demo Owner Three", "owner3@pgfinder.local", "OWNER");
            createUser("u-user1", "Demo Guest", "guest@pgfinder.local", "USER");
            createUser("u-admin", "Demo Admin", "admin@pgfinder.local", "ADMIN");
        }
        UserAccount guest = users.findById("u-user1").orElse(null);
        if (guest == null) return;
        List<Bed> bookedBeds = pgs.findAll().stream()
                .flatMap(pg -> pg.getRooms().stream())
                .flatMap(room -> room.getBeds().stream())
                .filter(bed -> "booked".equals(bed.getStatus()) && bed.getBookingId() != null)
                .toList();
        for (Bed bed : bookedBeds) {
            if (bookings.existsById(bed.getBookingId())) continue;
            Booking booking = new Booking();
            booking.setId(bed.getBookingId());
            booking.setBed(bed);
            booking.setGuest(guest);
            booking.setStartDate(LocalDate.now());
            booking.setEndDate(LocalDate.now().plusDays(30));
            booking.setStatus("confirmed");
            bookings.save(booking);
        }
    }

    private void createUser(String id, String name, String email, String role) {
        UserAccount account = new UserAccount();
        account.setId(id);
        account.setName(name);
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode("demo1234"));
        account.setRole(role);
        account.setStatus("active");
        users.save(account);
    }
}
