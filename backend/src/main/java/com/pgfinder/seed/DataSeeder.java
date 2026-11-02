package com.pgfinder.seed;

import com.pgfinder.model.Bed;
import com.pgfinder.model.Pg;
import com.pgfinder.model.Room;
import com.pgfinder.repository.PgRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

/**
 * Fills an empty database with the same sample PGs as the frontend's src/data/seed.js. It uses the
 * same pseudo-random generator, so rooms, rents and free beds match what the React demo shows.
 * Runs once at startup and does nothing if PGs already exist.
 */
@Component
@Profile("dev")
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final PgRepository pgRepository;

    public DataSeeder(PgRepository pgRepository) {
        this.pgRepository = pgRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (pgRepository.count() > 0) return;
        List<Pg> pgs = IntStream.range(0, PG_DEFS.size()).mapToObj(i -> buildPg(PG_DEFS.get(i), i)).toList();
        applySeedBookings(pgs);
        pgRepository.saveAll(pgs);
        log.info("Seeded {} sample PGs", pgs.size());
    }

    // ---------- sample data (copied from seed.js) ----------

    private record Locality(String locality, String city, double lat, double lng) {
    }

    private static final List<Locality> LOCALITIES = List.of(
            new Locality("Madhapur", "Hyderabad", 17.4486, 78.3908),
            new Locality("Gachibowli", "Hyderabad", 17.4401, 78.3489),
            new Locality("Kondapur", "Hyderabad", 17.4622, 78.3568),
            new Locality("Hitech City", "Hyderabad", 17.4504, 78.381),
            new Locality("Ameerpet", "Hyderabad", 17.4375, 78.4483),
            new Locality("SR Nagar", "Hyderabad", 17.4417, 78.443),
            new Locality("Kukatpally", "Hyderabad", 17.4948, 78.3996),
            new Locality("Koramangala", "Bangalore", 12.9352, 77.6245),
            new Locality("HSR Layout", "Bangalore", 12.9116, 77.6474),
            new Locality("BTM Layout", "Bangalore", 12.9166, 77.6101),
            new Locality("Whitefield", "Bangalore", 12.9698, 77.75),
            new Locality("Electronic City", "Bangalore", 12.8452, 77.6602));

    private static final List<String> AMENITIES = List.of(
            "Wi-Fi", "AC", "Food", "Laundry", "Power Backup", "CCTV", "Housekeeping",
            "Hot Water", "Parking", "Gym", "TV", "Fridge", "RO Water", "Lift", "Security Guard");

    private static final List<String> PHOTOS = List.of(
            "photo-1522708323590-d24dbb6b0267", "photo-1505693416388-ac5ce068fe85", "photo-1560448204-e02f11c3d0e2",
            "photo-1502672260266-1c1ef2d93688", "photo-1493809842364-78817add7ffb", "photo-1555854877-bab0e564b8d5",
            "photo-1586023492125-27b2c045efd7", "photo-1540518614846-7eded433c457", "photo-1598928506311-c55ded91a20c",
            "photo-1631049307264-da0ec9d70304", "photo-1484154218962-a197022b5858", "photo-1556909114-f6e7ad7d3136",
            "photo-1600585154340-be6161a56a0c", "photo-1568605114967-8130f3a36994", "photo-1512917774080-9991f1c4c750");

    private static final List<String> RULES = List.of(
            "Gate closes at 11:00 PM", "No smoking / alcohol inside premises",
            "Visitors allowed till 8:00 PM", "1 month notice before vacating");

    private static final String[][] FOOD_MENU = {
            {"Monday", "Idli, Sambar, Chutney", "Rice, Dal, Aloo Fry, Curd", "Chapati, Paneer Curry, Rice"},
            {"Tuesday", "Poha, Tea", "Rice, Sambar, Beans Curry, Papad", "Chapati, Mixed Veg, Rice, Rasam"},
            {"Wednesday", "Upma, Chutney, Coffee", "Veg Biryani, Raita", "Chapati, Egg Curry / Dal Fry"},
            {"Thursday", "Dosa, Chutney, Sambar", "Rice, Rajma, Cabbage Fry, Curd", "Pulao, Kurma, Sweet"},
            {"Friday", "Puri, Aloo Curry", "Rice, Dal Tadka, Bhindi Fry", "Chapati, Chana Masala, Rice"},
            {"Saturday", "Pongal, Vada", "Lemon Rice, Curd Rice, Pickle", "Fried Rice, Manchurian"},
            {"Sunday", "Aloo Paratha, Curd", "Chicken Biryani / Veg Biryani", "Chapati, Dal, Rice, Ice Cream"},
    };

    private static final String[] SHARING_TYPE = {null, "Single Sharing", "Double Sharing", "Triple Sharing", "Four Sharing"};
    private static final int[] SHARING_BASE = {0, 12000, 8500, 7000, 6000};
    private static final String[] BED_LETTERS = {"A", "B", "C", "D"};

    private record PgDef(String name, int loc, String gender, String owner, int floors, int roomsPerFloor,
                         double priceFactor, String address, int[] amenities, String status) {
    }

    private static final List<PgDef> PG_DEFS = List.of(
            new PgDef("Sri Sai Comfort PG", 0, "Boys", "u-owner1", 3, 3, 1.1, "Plot 42, Ayyappa Society, Madhapur", new int[]{0, 1, 2, 3, 4, 5, 6, 7, 12}, "approved"),
            new PgDef("Lotus Ladies Hostel", 1, "Girls", "u-owner1", 2, 4, 1.15, "Near DLF Cyber City, Gachibowli", new int[]{0, 2, 3, 4, 5, 6, 7, 12, 14}, "approved"),
            new PgDef("Green Nest Co-Living", 2, "Co-living", "u-owner1", 3, 2, 1.3, "Botanical Garden Rd, Kondapur", new int[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13}, "approved"),
            new PgDef("Hitech Executive Stay", 3, "Boys", "u-owner2", 4, 2, 1.25, "Opp. Cyber Towers, Hitech City", new int[]{0, 1, 2, 4, 5, 6, 7, 8, 10, 13}, "approved"),
            new PgDef("Ameerpet Students PG", 4, "Boys", "u-owner2", 2, 3, 0.8, "Lane 3, Mythrivanam, Ameerpet", new int[]{0, 2, 4, 7, 12}, "approved"),
            new PgDef("Annapurna Womens PG", 5, "Girls", "u-owner2", 2, 3, 0.9, "Main Rd, SR Nagar", new int[]{0, 2, 3, 4, 5, 7, 12, 14}, "approved"),
            new PgDef("Metro View PG", 6, "Boys", "u-owner1", 3, 2, 0.95, "Near KPHB Metro, Kukatpally", new int[]{0, 2, 4, 5, 7, 8, 12}, "approved"),
            new PgDef("Zolo Style Koramangala", 7, "Co-living", "u-owner2", 3, 3, 1.35, "5th Block, Koramangala", new int[]{0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 13}, "approved"),
            new PgDef("HSR Girls Residency", 8, "Girls", "u-owner2", 2, 3, 1.2, "Sector 2, HSR Layout", new int[]{0, 1, 2, 3, 4, 5, 6, 7, 12, 14}, "approved"),
            new PgDef("BTM Budget Stay", 9, "Boys", "u-owner3", 2, 3, 0.85, "2nd Stage, BTM Layout", new int[]{0, 2, 4, 7}, "pending"),
            new PgDef("Whitefield Tech Homes", 10, "Co-living", "u-owner1", 3, 2, 1.2, "ITPL Main Rd, Whitefield", new int[]{0, 1, 2, 3, 4, 5, 6, 7, 8, 13}, "approved"),
            new PgDef("E-City Comfort PG", 11, "Boys", "u-owner2", 2, 3, 0.9, "Phase 1, Electronic City", new int[]{0, 2, 4, 5, 7, 8}, "approved"));

    /** Beds already taken by the seed bookings in seed.js: bookingId, pgId, room index, bed, status. */
    private static final String[][] SEED_BOOKINGS = {
            {"bk-1001", "pg-1", "0", "A", "allocated"},
            {"bk-1002", "pg-1", "1", "A", "allocated"},
            {"bk-1003", "pg-3", "0", "A", "allocated"},
            {"bk-1004", "pg-2", "1", "A", "booked"},
            {"bk-1005", "pg-1", "3", "A", "booked"},
    };

    // ---------- builders ----------

    private static Pg buildPg(PgDef def, int i) {
        Locality loc = LOCALITIES.get(def.loc());
        Rng rand = new Rng(i * 31L + 7);
        Pg pg = new Pg();
        pg.setId("pg-" + (i + 1));
        pg.setOwnerId(def.owner());
        pg.setName(def.name());
        pg.setGender(def.gender());
        pg.setAddress(def.address());
        pg.setLocality(loc.locality());
        pg.setCity(loc.city());
        pg.setLat(loc.lat() + (rand.next() - 0.5) * 0.012);
        pg.setLng(loc.lng() + (rand.next() - 0.5) * 0.012);
        pg.setPhone("+91 9" + (long) Math.floor(100000000 + rand.next() * 899999999));
        pg.setDescription(def.name() + " is a well-maintained " + def.gender().toLowerCase() + " PG in "
                + loc.locality() + ", " + loc.city() + ", close to IT parks, metro and markets. Homely food, "
                + "24x7 security and regular housekeeping make it a comfortable place to stay.");
        pg.setAmenities(new ArrayList<>(IntStream.of(def.amenities()).mapToObj(AMENITIES::get).toList()));
        pg.setRules(new ArrayList<>(RULES));
        pg.setImages(new ArrayList<>(IntStream.range(0, 5)
                .mapToObj(k -> "https://images.unsplash.com/" + PHOTOS.get((i * 3 + k) % PHOTOS.size())
                        + "?auto=format&fit=crop&w=1000&q=70")
                .toList()));
        pg.setFoodMenu(foodMenu());
        pg.setDepositMonths(1);
        pg.setStatus(def.status());
        pg.setCreatedAt(LocalDate.now().plusDays(-200 + i * 9L));
        makeRooms(pg, i + 1, def.floors(), def.roomsPerFloor(), def.priceFactor());
        return pg;
    }

    private static void makeRooms(Pg pg, int pgIndex, int floors, int roomsPerFloor, double priceFactor) {
        Rng rand = new Rng(pgIndex * 7919L + 13);
        for (int f = 1; f <= floors; f++) {
            for (int r = 1; r <= roomsPerFloor; r++) {
                int sharing = 1 + (int) Math.floor(rand.next() * 4);
                boolean ac = rand.next() > 0.5;
                String roomNo = f + "0" + r;
                Room room = new Room();
                room.setId("room-" + pgIndex + "-" + roomNo);
                room.setRoomNo(roomNo);
                room.setFloor(f);
                room.setSharing(sharing);
                room.setType(SHARING_TYPE[sharing]);
                room.setAc(ac);
                room.setAttachedBathroom(rand.next() > 0.3);
                room.setRentPerBed((int) Math.round((SHARING_BASE[sharing] * priceFactor + (ac ? 1500 : 0)) / 100) * 100);
                for (int b = 0; b < sharing; b++) {
                    room.addBed(new Bed(BED_LETTERS[b], rand.next() < 0.55 ? "occupied" : "available"));
                }
                pg.addRoom(room);
            }
        }
    }

    private static void applySeedBookings(List<Pg> pgs) {
        for (String[] bk : SEED_BOOKINGS) {
            Pg pg = pgs.stream().filter(p -> p.getId().equals(bk[1])).findFirst().orElseThrow();
            Room room = pg.getRooms().get(Integer.parseInt(bk[2]));
            Bed bed = room.getBeds().stream().filter(b -> b.getBedNo().equals(bk[3])).findFirst()
                    .orElse(room.getBeds().get(0));
            bed.setStatus("allocated".equals(bk[4]) ? "occupied" : "booked");
            bed.setBookingId(bk[0]);
        }
    }

    private static Map<String, Map<String, String>> foodMenu() {
        Map<String, Map<String, String>> menu = new LinkedHashMap<>();
        for (String[] day : FOOD_MENU) {
            Map<String, String> meals = new LinkedHashMap<>();
            meals.put("breakfast", day[1]);
            meals.put("lunch", day[2]);
            meals.put("dinner", day[3]);
            menu.put(day[0], meals);
        }
        return menu;
    }

    /** Port of rng() in seed.js (Park-Miller generator) so both sides generate the same data. */
    private static final class Rng {
        private long s;

        Rng(long seed) {
            s = seed % 2147483647L;
            if (s <= 0) s += 2147483646L;
        }

        double next() {
            s = (s * 16807L) % 2147483647L;
            return s / 2147483647.0;
        }
    }
}
