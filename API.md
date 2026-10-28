# PgFinder API

Base URL: `http://localhost:8080`

This file documents the implemented backend routes. Protected endpoints require
`Authorization: Bearer <token>` from `/api/auth/login` or `/api/auth/register`.

## Public PG listings

| Method | Endpoint | Description | Status |
|---|---|---|---|
| GET | `/api/pgs` | Search approved PG listings; accepts optional `name` (case-insensitive partial match), `lat`, `lng`, `radiusKm`, `gender`, `sharing`, `maxRent`, and `sort` query parameters | Implemented |
| GET | `/api/pgs/{pgId}` | Get a PG with its rooms and beds | Implemented |
| GET | `/api/pgs/{pgId}/availability` | Get availability for a PG; optionally provide both `startDate` and `endDate` as ISO dates | Implemented |

## Authentication

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Create an account | Public |
| POST | `/api/auth/login` | Sign in | Public |
| GET | `/api/auth/me` | Get the signed-in user | Authenticated |

Supported roles: `USER`, `OWNER`, and `ADMIN`. Public registration accepts `USER` or `OWNER`;
admin accounts are provisioned separately. Tokens expire after 24 hours.

## Owner PG management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/owner/pgs` | List the signed-in owner's PGs |
| POST | `/api/owner/pgs` | Create a PG listing |
| GET | `/api/owner/pgs/{pgId}` | Get one of the owner's PGs |
| PUT | `/api/owner/pgs/{pgId}` | Update one of the owner's PGs |
| DELETE | `/api/owner/pgs/{pgId}` | Delete one of the owner's PGs |

New and edited listings must follow the listing approval flow. Owners may manage
only their own listings. New and updated listings are set to `pending`; DELETE disables the
listing so existing records are preserved.

## Rooms and beds

All routes in this section are restricted to the owner of the PG.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/owner/pgs/{pgId}/rooms` | Add a room |
| PUT | `/api/owner/pgs/{pgId}/rooms/{roomId}` | Update a room |
| DELETE | `/api/owner/pgs/{pgId}/rooms/{roomId}` | Delete a room |
| POST | `/api/owner/pgs/{pgId}/rooms/{roomId}/beds` | Add a bed |
| PUT | `/api/owner/pgs/{pgId}/rooms/{roomId}/beds/{bedId}` | Update a bed, including availability status |
| DELETE | `/api/owner/pgs/{pgId}/rooms/{roomId}/beds/{bedId}` | Delete a bed |

## Bookings

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/bookings` | Create a booking | Authenticated guest |
| GET | `/api/bookings/my` | List the signed-in guest's bookings | Authenticated guest |
| GET | `/api/owner/bookings` | List bookings for the signed-in owner's PGs | Owner |
| PATCH | `/api/bookings/{bookingId}/vacate-request` | Ask the PG owner to confirm that the guest has vacated | Booking guest |
| PATCH | `/api/owner/bookings/{bookingId}/confirm-vacancy` | Confirm a pending vacancy request and release the bed | Relevant owner |
| PATCH | `/api/bookings/{bookingId}/cancel` | Cancel a booking | Booking guest or relevant owner |

Booking creation must prevent overlapping bookings for the same bed and dates. A vacancy request
is visible in the owner's bookings list with status `vacate_requested`; the bed remains assigned
until its owner confirms the request, at which point the booking becomes `vacated` and the bed is
made available. A confirmed booking is required before a user can post a review.

## Reviews

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pgs/{pgId}/reviews` | List reviews for a PG |
| POST | `/api/pgs/{pgId}/reviews` | Create a review |
| PUT | `/api/reviews/{reviewId}` | Update the signed-in review author's review |
| DELETE | `/api/reviews/{reviewId}` | Delete the signed-in review author's review |

## Complaints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/complaints` | Submit a complaint | Authenticated user |
| GET | `/api/complaints/my` | List the signed-in user's complaints | Authenticated user |
| GET | `/api/owner/complaints` | List complaints relevant to the signed-in owner's PGs | Owner |
| PATCH | `/api/owner/complaints/{complaintId}` | Respond to or update a relevant complaint | Relevant owner or admin |

## Admin

All routes in this section are restricted to admins.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/pgs?status=pending` | List PG listings, optionally filtered by status |
| PATCH | `/api/admin/pgs/{pgId}/status` | Approve or change a PG listing's status |
| GET | `/api/admin/users` | List users |
| PATCH | `/api/admin/users/{userId}/status` | Change a user's status |

## PG photos

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/owner/pgs/{pgId}/images` | Upload a photo for the owner's PG (multipart field `file`; JPEG, PNG, or WebP; up to 10 MB) |
| DELETE | `/api/owner/pgs/{pgId}/images/{imageId}` | Remove a photo from the owner's PG |

Images are stored locally in the configured `UPLOAD_DIR` folder and served from `/uploads/`.
This is intended for development; use durable shared storage for a multi-instance production
deployment.
