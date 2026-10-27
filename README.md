# PgFinder Backend

REST API for PgFinder, built with Java 25, Spring Boot 3.5, Spring Data JPA, and MySQL. The `dev`
profile uses an in-memory H2 database and is suitable for local testing.

## Run locally

Start with H2 (no MySQL required):

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

The API listens on `http://localhost:8080`. H2 data is recreated each time the app restarts.
The H2 console is available at `http://localhost:8080/h2-console` with JDBC URL
`jdbc:h2:mem:pgfinder`.

For MySQL, create/use the `pgfinder` database and set credentials before starting:

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-password"
.\mvnw.cmd spring-boot:run
```

## Development sample data

On an empty database, the backend seeds 12 demo PG listings with rooms, beds, amenities, rules,
photos, and weekly food menus. The dev profile also seeds demo accounts:

| Role | Email | Password |
|---|---|---|
| Owner | `owner1@pgfinder.local` | `demo1234` |
| Owner | `owner2@pgfinder.local` | `demo1234` |
| Owner | `owner3@pgfinder.local` | `demo1234` |
| Guest | `guest@pgfinder.local` | `demo1234` |
| Admin | `admin@pgfinder.local` | `demo1234` |

These accounts are created only with the `dev` profile. Do not use demo credentials in production.
Passwords for registered users are stored as BCrypt hashes. Login and registration return a
24-hour bearer token; pass it as `Authorization: Bearer <token>` to protected endpoints.

## API

The endpoint catalog and access rules are in [API.md](./API.md). It covers authentication, public
listing search/details, owner listing and room/bed management, bookings, reviews, complaints,
admin moderation, and local photo uploads.

Listing deletion is a soft delete (`status=disabled`) so existing booking/review records are
preserved. New and edited listings are set to `pending` until an admin approves them. Booking
creation locks the bed row and rejects overlapping date ranges.

## Photo uploads

Photos are stored on the local filesystem, not in the database. The default folder is `uploads/`;
override it with `UPLOAD_DIR`. Uploads accept JPEG, PNG, or WebP up to 10 MB using multipart field
`file`. The API returns a relative URL under `/uploads/`.

Configure the frontend origin(s) with `CORS_ALLOWED_ORIGINS` as a comma-separated list. The
defaults are `http://localhost:3000` and `http://localhost:5173`.

## Test

```powershell
.\mvnw.cmd test
```
