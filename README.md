<<<<<<< HEAD
# PgFinder
=======
# PG Finder – Backend (Java / Spring Boot)

REST API for the PG Finder React app. Java 17, Spring Boot 3.3, Spring Data JPA (Hibernate), MySQL.

## Run

The Maven wrapper (`mvnw`) is included, so a separate Maven install is optional.

**With MySQL** (the `pgfinder` database is created automatically on first start):

```powershell
$env:DB_PASSWORD = "your-mysql-root-password"   # $env:DB_USERNAME too if you don't use root
.\mvnw spring-boot:run
```

**Without MySQL** (in-memory H2 database, data is reset on every restart):

```powershell
.\mvnw spring-boot:run "-Dspring-boot.run.profiles=dev"
```

The API runs at http://localhost:8080. On first start it loads the same 12 sample PGs as the
frontend's `src/data/seed.js`.

Run the tests: `.\mvnw test`

## APIs

| Method | URL | Description |
|---|---|---|
| GET | `/api/pgs` | Search approved PGs. Optional query params: `lat`, `lng`, `radiusKm`, `gender` (Boys/Girls/Co-living), `sharing` (1-4, only rooms with a free bed), `maxRent`, `sort` (distance/price/name) |
| GET | `/api/pgs/{id}` | One PG with all rooms, beds, food menu and bed stats. `404` if not found |

Examples:

- http://localhost:8080/api/pgs?lat=17.4486&lng=78.3908&radiusKm=10
- http://localhost:8080/api/pgs/pg-1

Errors come back as `{ "status": 404, "error": "PG not found: pg-999", "timestamp": "..." }`.

## Structure

```
src/main/java/com/pgfinder/
  controller/   URLs (REST endpoints)  -> call services
  service/      business logic         -> call repositories
  repository/   database access (Spring Data JPA)
  model/        entities = database tables (Pg, Room, Bed)
  dto/          JSON shapes returned by the API
  exception/    error -> JSON response mapping
  config/       CORS (lets the React app on localhost:3000 call the API)
  seed/         sample data loaded into an empty database
src/main/resources/
  application.properties       MySQL settings (default)
  application-dev.properties   H2 in-memory settings ("dev" profile)
```

## Roadmap

1. ~~Project setup, PG search and details~~
2. Users, register/login with hashed passwords and JWT, role checks
3. Bookings and payments (bed can't be double-booked)
4. Owner APIs: manage PGs, rooms, beds, allocate bookings, photo upload
5. Complaints, reviews, Super Admin approvals and settings
6. Point the React app's `src/store/db.js` at these APIs
>>>>>>> ab16f33 (Initial commit)
