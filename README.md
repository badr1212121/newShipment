# Shipment Tracker

A full-stack shipment / logistics tracking application. Admins create shipments and
assign drivers; customers and drivers see only their own shipments; users message each
other in-app. Built with a Spring Boot REST API and a React single-page frontend.

## Tech stack

**Backend**
- Java 17, Spring Boot 4
- Spring Web (REST), Spring Data JPA (Hibernate), Spring Security
- JWT authentication (jjwt)
- MySQL

**Frontend**
- React 18 + Vite
- React Router, Axios
- Tailwind CSS + shadcn/ui
- Leaflet (maps)

## Features

- JWT-based auth (register / login) with `ADMIN`, `CUSTOMER`, `DRIVER` roles
- Role-based shipment access — customers/drivers only see their own shipments
- Shipment CRUD, driver & customer assignment, status updates with current location
- Packages per shipment
- In-app messaging between users, with unread counts
- Tracking map (origin / destination / current location) via Leaflet + geocoding

## Getting started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8+ (a database named `shipment`)

### Backend

Local credentials are kept out of git. Copy the example profile and fill in your values:

```bash
cd shipment/src/main/resources
cp application-local.properties.example application-local.properties
# edit application-local.properties with your MySQL username/password
```

Run with the `local` profile:

```bash
cd shipment
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

The API starts on http://localhost:8080. Configuration can also be supplied via
environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`,
`SERVER_PORT`, `JPA_DDL_AUTO`) — see `application.properties`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on http://localhost:5173 and proxies `/api` to the backend on port 8080.

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in (email + password), returns a JWT |
| GET | `/api/shipments` | List shipments (scoped by role) |
| POST | `/api/shipments` | Create a shipment (ADMIN) |
| GET | `/api/shipments/id/{id}` | Get a shipment by id |
| PUT | `/api/shipments/{id}/status` | Update status / current location |
| PUT | `/api/shipments/{id}/assign-driver` | Assign a driver |
| GET | `/api/drivers` | List drivers |
| GET | `/api/messages/inbox` | List conversations |
| POST | `/api/messages` | Send a message |

Send the token as `Authorization: Bearer <token>` on protected routes.
