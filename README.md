# COMP 3123 Assignment 1 — Employee Management API

**Student:** Joshua Zaakir  
**Student number:** 101578900  
**Course:** COMP 3123 — Full Stack Development I

## Project overview

This project is a secure REST API for user authentication and employee management. Users can create an account, log in with a username or email, and manage only the employees associated with their own account.

- **GitHub:** [github.com/JoshuaZaakir/101578900_COMP3123_Assignment1](https://github.com/JoshuaZaakir/101578900_COMP3123_Assignment1)
- **Local URL:** `http://localhost:3000`
- **Vercel URL:** [101578900-comp-3123-assignment1.vercel.app](https://101578900-comp-3123-assignment1.vercel.app)

## Technologies

- Node.js and Express
- MongoDB and Mongoose
- JSON Web Tokens for authentication
- bcryptjs for password hashing
- express-validator for request validation
- Helmet and express-rate-limit for API security
- Winston and Morgan for local logging
- Jest, Supertest, and MongoDB Memory Server for testing

## Main features

- User signup and login by username or email
- Hashed passwords that are never returned by the API
- JWT-protected employee endpoints
- Employee create, read, update, and delete operations
- Server-side ownership checks so users access only their own employees
- Consistent JSON validation and error responses
- Helmet security headers and configurable rate limiting
- Local request and application logs
- Application and database health status

## Project structure

```text
logs/                Local log directory and sanitized sample
postman/             Exported Postman collection
src/
  config/            Database and logger configuration
  controllers/       User and employee controllers
  middleware/        Authentication, validation, limits, and errors
  models/            Mongoose User and Employee models
  routes/            Express routers
  services/          JWT creation and verification
  validators/        Request validation rules
tests/               Jest and Supertest API tests
app.js               Express application
server.js            Local server entry point
```

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/JoshuaZaakir/101578900_COMP3123_Assignment1.git
   cd 101578900_COMP3123_Assignment1
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and replace the example JWT secret:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Start MongoDB locally, use MongoDB Atlas, or start the included Docker service:

   ```bash
   docker compose up -d
   ```

5. Start the API:

   ```bash
   npm start
   ```

For development with automatic restart:

```bash
npm run dev
```

## Environment variables

| Variable | Description |
| --- | --- |
| `PORT` | Local server port; defaults to `3000` |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB_NAME` | Must remain `comp3123_assignment1` |
| `JWT_SECRET` | JWT signing secret of at least 32 UTF-8 bytes |
| `JWT_EXPIRES_IN` | Token lifetime; defaults to `1h` |
| `LOG_LEVEL` | Winston logging level |
| `LOG_DIR` | Log directory; defaults to `logs` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit time window |
| `AUTH_RATE_LIMIT_MAX` | Maximum signup/login requests per window |
| `API_RATE_LIMIT_MAX` | Maximum general API requests per window |

The real `.env` file is excluded from Git.

## API endpoints

### Health

| Method | Endpoint | Status | Description |
| --- | --- | --- | --- |
| GET | `/health` | 200 | Returns application and database status |

### Users

| Method | Endpoint | Status | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/user/signup` | 201 | Register a user |
| POST | `/api/v1/user/login` | 200 | Login with username or email and receive a JWT |

Signup passwords must contain at least eight characters, including uppercase, lowercase, and numeric characters. Passwords cannot exceed 72 UTF-8 bytes.

### Employees

All employee routes require:

```text
Authorization: Bearer <jwt>
```

| Method | Endpoint | Status | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/emp/employees` | 200 | List the authenticated user's employees |
| POST | `/api/v1/emp/employees` | 201 | Create an employee |
| GET | `/api/v1/emp/employees/:eid` | 200 | Get an owned employee |
| PUT | `/api/v1/emp/employees/:eid` | 200 | Update an owned employee |
| DELETE | `/api/v1/emp/employees?eid=<id>` | 204 | Delete an owned employee |

## Authentication and ownership

Passwords are hashed with bcrypt before being stored. After login, the API returns a signed JWT. Authentication middleware verifies the token and identifies the user from its subject.

Each employee stores a required `user` ObjectId referencing its owner. The owner is taken from the verified JWT instead of the request body. List, read, update, and delete operations enforce this relationship. Cross-user access returns `403 Forbidden`.

## Validation and errors

The API validates required fields, email addresses, password rules, salary values, joining dates, and MongoDB ObjectIds. Unexpected request fields are rejected.

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

The API uses `400`, `401`, `403`, `404`, `409`, `429`, `500`, and `503` where appropriate.

## Security

- bcrypt password hashing
- JWT signature and expiration verification
- Minimum 32-byte JWT secret
- Helmet HTTP security headers
- Authentication and general API rate limits
- Request-body limits and field validation
- Environment variables for private configuration
- Sanitized errors without stack traces or credentials

## Logging and health

Local logs are written to `logs/combined.log` and `logs/error.log`. They include request details, authentication events, validation failures, authorization failures, and application errors. Passwords, credentials, secrets, and complete tokens are not logged.

`GET /health` returns `200` when Express is running. It reports `ok` when MongoDB is connected and `degraded` when it is disconnected.

## Testing

```bash
npm test
npm run test:coverage
```

The tests cover authentication, password hashing, validation, JWT failures, employee CRUD, two-user ownership isolation, error responses, Helmet headers, and rate limiting.

## Postman collection

Import:

```text
postman/COMP3123_Assignment1.postman_collection.json
```

The collection uses `http://localhost:3000` by default and covers successful requests, validation failures, JWT errors, employee ownership checks, and rate limiting. Run the rate-limit folder last.

## Vercel deployment

The root `app.js` exports the Express application for Vercel, while `server.js` is used locally. Configure `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, and `JWT_EXPIRES_IN` in Vercel before deployment.
