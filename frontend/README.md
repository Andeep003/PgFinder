# PG Finder (frontend)

Location-based PG search and booking, with Resident, PG Owner (admin) and Super Admin portals.
UI follows the HRMS_frontEnd design system (React + react-scripts + Tailwind + lucide-react, role-colored sidebars).
Public search and PG details use the Spring Boot API when it is available; account and portal demo
flows continue to use browser localStorage.

## Run

```bash
npm install
npm start         # React development server at http://localhost:3000
```

On Windows, running `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"` from the
repository root starts this frontend in a separate terminal window along with the backend. If
needed, the frontend dependencies are installed automatically on first launch.

The frontend calls `http://localhost:8080` by default. Override the API origin with
`REACT_APP_API_URL` if the backend is hosted elsewhere. If the API is unavailable, the search page
falls back to its local sample listings.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Resident (allocated) | user@pgfinder.com | user123 |
| Resident (awaiting allocation) | priya@pgfinder.com | user123 |
| PG Owner | owner@pgfinder.com | owner123 |
| Super Admin | admin@pgfinder.com | admin123 |

"Reset all demo data" on the login page (or Super Admin → Settings) restores the seed.

## Flow

1. **Home**: asks for your location and lists PGs near you (falls back to Madhapur, Hyderabad).
   Search any area (demo localities resolve offline; others go through OpenStreetMap). Filter by
   gender, sharing, distance and budget, and switch between list and map views.
   Approved PG listings include a **View location on Google Maps** link in search results.
2. **PG details**: photos uploaded by the owner, amenities, food menu, reviews, and every room with
   its bed availability. Pick a free bed and choose **Book this slot**.
3. **Register**: resident details plus a login password ("Fill sample data" fills it in), and a move-in date.
4. **Payment**: dummy UPI, card or net banking. On success it returns to the home page.
5. **Login** with the same email and password. The dashboard shows the booking as *awaiting allocation*.
6. **Owner** logs in, opens Bookings and selects **Allocate**.
7. **Resident** logs in again and sees the full dashboard: room/bed number, fees, last payment and date,
   next due date, pay rent, food menu, complaints and ratings.

When adding a PG, the owner must provide its Google Maps share link and map coordinates. Links
containing coordinates fill the latitude/longitude automatically; approved listings show the link
in public search results and on the PG details page.

## Structure

```
src/
  data/seed.js            sample PGs, rooms, beds, users, bookings, payments, complaints, reviews
  store/db.js             localStorage "database" + all actions (replace with API calls later)
  store/auth.jsx          session / login
  components/             ui kit (StatTile, StatusBadge, Modal, Table…), layouts, PG widgets, map
  pages/public/           Home, PGDetails, BookingRegister, Payment, Login, OwnerSignup
  pages/user/             Resident portal
  pages/owner/            PG Owner portal
  pages/superadmin/       Super Admin portal
```

The API client is in `src/api.js`. Public PG search and detail pages call `/api/pgs`; the remaining
demo account, booking, owner and admin flows still use `src/store/db.js`.
