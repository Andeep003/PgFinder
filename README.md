# PgFinder

Location-based PG search and booking, with Resident, PG Owner and Super Admin portals.

| Folder | What it is |
|---|---|
| [`backend/`](./backend) | REST API — Java 25, Spring Boot 3.5, H2 (default) or MySQL. See [backend/README.md](./backend/README.md) and [backend/API.md](./backend/API.md). |
| [`frontend/`](./frontend) | Web app — React, Tailwind, lucide-react. See [frontend/README.md](./frontend/README.md). |

## Run locally

Backend (API on http://localhost:8080):

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

On Windows this also opens the frontend dev server in a separate terminal window.
To run the frontend on its own (http://localhost:3000):

```powershell
cd frontend
npm install
npm start
```
