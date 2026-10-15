# COMP 3123 Assignment 1 — Secure Employee Management API

**Student:** Joshua Zaakir  
**Student number:** 101578900  
**Course:** COMP 3123 — Full Stack Development I

This project is a RESTful backend API for user accounts and employee management. A user can create an account, sign in with either a username or an email address, and manage only the employees that belong to that account. The API uses JWT authentication, MongoDB relationships, input validation, password hashing, security headers, rate limiting, local logs, automated tests, and consistent JSON errors.

## Deployed API

- Local base URL: `http://localhost:3000`
- Vercel base URL: `Add the deployed Vercel URL here before submission`
- Health check: `GET /health`

## Main features

- User signup with unique username and email validation
- Login by username or email
- Password hashing with `bcryptjs`
- JWT Bearer authentication for every employee endpoint
- Employee create, read, update, and delete operations
- A Mongoose reference from each employee to its owner
- Server-side ownership checks that prevent cross-user access
- Validation for request bodies, credentials, dates, salaries, and MongoDB IDs
- Helmet HTTP security headers
- Separate authentication and general API rate limits
- Centralized JSON error handling and 404 handling
- Local request, authentication, validation, authorization, and error logging
- Health check with application and database state
- Jest/Supertest endpoint tests and an exported Postman collection
- Vercel-compatible Express entry point

## Technologies

| Area | Technology |
| --- | --- |
| Runtime | Node.js 20 or newer |
| Web framework | Express 5 |
| Database | MongoDB with Mongoose |
| Authentication | JSON Web Token (`jsonwebtoken`) |
| Password protection | `bcryptjs` |
| Validation | `express-validator` |
| Security | `helmet`, `express-rate-limit` |
| Logging | Winston and Morgan |
| Testing | Jest, Supertest, MongoDB Memory Server |
| Hosting | Vercel |

## Project structure

```text
101578900_COMP3123_Assignment1/
├── api/                         # Vercel serverless entry point
├── docs/
│   └── SCREENSHOT_CHECKLIST.md  # Ordered assignment evidence checklist
├── logs/
│   ├── .gitkeep
│   └── sample.log               # Sanitized example; generated logs are ignored
├── postman/
│   └── COMP3123_Assignment1.postman_collection.json
├── src/
│   ├── config/                  # MongoDB and Winston configuration
│   ├── controllers/             # User and employee request handlers
│   ├── middleware/              # Auth, validation, rate limits, and errors
│   ├── models/                  # User and Employee Mongoose schemas
│   ├── routes/                  # Versioned Express routes
│   ├── services/                # JWT creation and verification
│   ├── utils/                   # Shared AppError and async helper
│   ├── validators/              # Request validation rules
├── tests/                       # Automated API tests
├── .env.example                 # Safe configuration template
├── .gitignore
├── app.js                       # Express application factory and setup
├── docker-compose.yml           # Optional local MongoDB service
├── package.json
├── server.js                    # Local application entry point
└── vercel.json                  # Minimal Vercel configuration
```

The application keeps routes, validation, authorization, database models, controllers, and error handling separate so each responsibility can be tested and maintained independently.

## Database design

The required MongoDB database name is exactly:

```text
comp3123_assignment1
```

### User

A user contains a unique `username`, unique normalized `email`, hashed `password`, and timestamps. The password field is excluded from normal query results and is never returned by the API.

### Employee

An employee contains `first_name`, `last_name`, `email`, `position`, `salary`, `date_of_joining`, `department`, timestamps, and a required `user` ObjectId reference to the `User` model.

The `user` field is assigned from the verified JWT. A client cannot choose or replace the employee owner by putting a user ID in the request body.

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB Community Server, MongoDB Atlas, or Docker Desktop
- Postman for the supplied API collection
- Git for cloning and version control

## Installation and local setup

1. Clone the repository and open it:

   ```bash
   git clone <GitHub-repository-URL>
   cd 101578900_COMP3123_Assignment1
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a private `.env` file from the safe example.

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:

   ```bash
   cp .env.example .env
   ```

4. Replace the example `JWT_SECRET` in `.env` with a long random value. Do not commit `.env`.

5. Start MongoDB using one of these options:

   - Start the locally installed MongoDB service, or
   - Use the included development container:

     ```bash
     docker compose up -d
     ```

   - Use MongoDB Atlas and set `MONGODB_URI` to the Atlas connection string.

6. Start the API:

   ```bash
   npm run dev
   ```

   For a normal production-style start:

   ```bash
   npm start
   ```

7. Confirm the API is running:

   ```text
   GET http://localhost:3000/health
   ```

## Environment variables

| Variable | Required | Example/default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Selects development, test, or production behavior. |
| `PORT` | No | `3000` | Local HTTP port. Vercel supplies its own runtime port. |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/comp3123_assignment1` | MongoDB connection string. |
| `MONGODB_DB_NAME` | No | `comp3123_assignment1` | Explicit database name; keep the required assignment value unchanged. |
| `JWT_SECRET` | Yes | safe placeholder in `.env.example` | Private key used to sign and verify JWTs. |
| `JWT_EXPIRES_IN` | No | `1h` | JWT lifetime accepted by `jsonwebtoken`. |
| `LOG_LEVEL` | No | `info` | Minimum Winston log level. |
| `LOG_DIR` | No | `logs` | Local generated-log directory. |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate-limit window in milliseconds (15 minutes). |
| `AUTH_RATE_LIMIT_MAX` | No | `20` | Maximum signup/login requests per IP in one window. |
| `API_RATE_LIMIT_MAX` | No | `100` | Maximum general API requests per IP in one window. |
| `DISABLE_RATE_LIMIT` | Tests only | `false` | Allows isolated automated tests to avoid shared limiter state. Keep `false` outside tests. |

The committed `.env.example` contains only development-safe placeholders. Actual JWT secrets, Atlas usernames/passwords, and other private credentials belong only in `.env` or the hosting provider's encrypted environment settings.

## npm commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the API with Node.js. |
| `npm run dev` | Start with Node's file-watch mode. |
| `npm test` | Run the Jest/Supertest test suite once. |
| `npm run test:coverage` | Run tests and produce a coverage report. |

## Response format

Successful JSON responses use a consistent envelope. The `data` object contains the requested resource, list, or JWT.

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Errors are also JSON and do not reveal stack traces or private configuration:

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

`details` is included when field-level validation information is useful. A successful `DELETE` returns `204 No Content`, so it intentionally has no response body.

## API endpoints

### Health and routing

| Method | Endpoint | Authentication | Success | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | No | `200` | Confirms that the application is running and reports database state. |
| Any | Unsupported path | Depends on path | `404` | Returns a JSON route-not-found error. |

### User endpoints

| Method | Endpoint | Authentication | Success | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/user/signup` | No | `201` | Register a user. |
| `POST` | `/api/v1/user/login` | No | `200` | Authenticate by username or email and return a JWT. |

### Employee endpoints

All employee endpoints require `Authorization: Bearer <jwt>`.

| Method | Endpoint | Success | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/emp/employees` | `200` | Return only employees owned by the signed-in user. |
| `POST` | `/api/v1/emp/employees` | `201` | Create an employee owned by the signed-in user. |
| `GET` | `/api/v1/emp/employees/:eid` | `200` | Return one owned employee. |
| `PUT` | `/api/v1/emp/employees/:eid` | `200` | Update an owned employee. |
| `DELETE` | `/api/v1/emp/employees?eid=<id>` | `204` | Delete an owned employee with an empty response body. |

The assignment's endpoint spelling, version prefix, methods, and success codes are used exactly.

### Endpoint status summary

| Endpoint | Expected statuses |
| --- | --- |
| `GET /health` | `200` while the Express handler is reachable; `status` can report a degraded database connection. The serverless entry point can return `503` if it cannot establish its initial database connection. |
| `POST /api/v1/user/signup` | `201` created, `400` validation/body error, `409` duplicate username/email, `429` rate limited, `500` unexpected error, or `503` unavailable database on the serverless entry point. |
| `POST /api/v1/user/login` | `200` authenticated, `400` validation/body error, `401` invalid credentials, `429` rate limited, `500` unexpected error, or `503` unavailable database on the serverless entry point. |
| `GET /api/v1/emp/employees` | `200` success, `401` missing/invalid/expired JWT, `429` rate limited, `500` unexpected error, or `503` unavailable database on the serverless entry point. |
| `POST /api/v1/emp/employees` | `201` created, `400` validation/body error, `401` authentication error, `409` duplicate employee email for the same owner, `429` rate limited, `500` unexpected error, or `503` unavailable database. |
| `GET /api/v1/emp/employees/:eid` | `200` success, `400` invalid ID, `401` authentication error, `403` employee belongs to another user, `404` employee not found, `429` rate limited, `500` unexpected error, or `503` unavailable database. |
| `PUT /api/v1/emp/employees/:eid` | `200` updated, `400` invalid ID/body, `401` authentication error, `403` employee belongs to another user, `404` employee not found, `409` duplicate employee email, `429` rate limited, `500` unexpected error, or `503` unavailable database. |
| `DELETE /api/v1/emp/employees?eid=<id>` | `204` deleted, `400` missing/invalid ID, `401` authentication error, `403` employee belongs to another user, `404` employee not found, `429` rate limited, `500` unexpected error, or `503` unavailable database. |
| Unsupported route | `404` JSON route error. |

Malformed JSON is handled as `400 Bad Request`. A JSON body larger than the configured 100 KB limit is rejected with `413 Payload Too Large`.

## Request examples

### Signup

```http
POST /api/v1/user/signup
Content-Type: application/json
```

```json
{
  "username": "joshua_user_a",
  "email": "joshua.user.a@example.com",
  "password": "UserA#2026!Secure"
}
```

Expected success: `201 Created`. Duplicate usernames or emails return `409 Conflict`; invalid or incomplete input returns `400 Bad Request`.

### Login with a username

```http
POST /api/v1/user/login
Content-Type: application/json
```

```json
{
  "username": "joshua_user_a",
  "password": "UserA#2026!Secure"
}
```

### Login with an email

```json
{
  "email": "joshua.user.a@example.com",
  "password": "UserA#2026!Secure"
}
```

Expected success: `200 OK`. The token is returned in `data.token`. Invalid credentials return `401 Unauthorized` without stating whether the account or password was wrong.

### Create an employee

```http
POST /api/v1/emp/employees
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "first_name": "Avery",
  "last_name": "Morgan",
  "email": "avery.morgan@example.com",
  "position": "Software Developer",
  "salary": 72000,
  "date_of_joining": "2026-01-12",
  "department": "Engineering"
}
```

Expected success: `201 Created`. The authenticated user becomes the owner regardless of any client-supplied ownership value.

### Update an employee

```http
PUT /api/v1/emp/employees/<employee-id>
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "position": "Senior Software Developer",
  "salary": 82000
}
```

Expected success: `200 OK`. At least one valid editable employee field must be supplied.

### Delete an employee

```http
DELETE /api/v1/emp/employees?eid=<employee-id>
Authorization: Bearer <jwt>
```

Expected success: `204 No Content` with an empty body.

## Authentication flow

1. The client signs up and then logs in.
2. The server verifies the password against the stored bcrypt hash.
3. A successful login returns a signed JWT in `data.token`.
4. The client sends `Authorization: Bearer <jwt>` to employee routes.
5. Authentication middleware verifies the signature and expiry and loads the authenticated user identity.
6. Employee controllers use that server-verified identity in ownership checks.

Missing, malformed, invalid, or expired tokens return `401 Unauthorized`. A password or full token is never written to logs or returned in an error.

## Employee ownership and authorization

Ownership is enforced on the server, not by trusting request input. Each employee stores a `user` ObjectId. Listing uses the authenticated user's ID as a filter. Read, update, and delete operations verify both the requested employee and its owner.

The supplied Postman collection creates two users and an employee for each. It demonstrates that:

- User A sees User A's employees but not User B's.
- User B sees User B's employees but not User A's.
- User A cannot retrieve, update, or delete User B's employee.
- User B cannot retrieve, update, or delete User A's employee.
- Changing `eid` in a path or query string does not bypass authorization.

Cross-user access returns `403 Forbidden`. A well-formed ID that does not identify an employee returns `404 Not Found`, while a malformed MongoDB ObjectId returns `400 Bad Request`.

## Validation and error handling

Incoming values are validated before a controller performs a database operation. Important checks include:

- required username, email, password, and employee fields;
- normalized email format and reasonable string lengths;
- strong password requirements;
- numeric and positive salary;
- valid `date_of_joining` values;
- valid MongoDB ObjectIds in path and query parameters;
- at least one supported field for an update;
- malformed JSON, unknown routes, duplicate values, invalid credentials, and database failures.

Validation failures return useful field information without echoing passwords or internal stack traces. A centralized error handler keeps the error shape consistent and converts unexpected errors into a safe `500 Internal Server Error` response.

## Security controls

### Password protection

Passwords are salted and hashed with bcrypt before they are written to MongoDB. Login compares the supplied password with the saved hash. Password hashes are excluded from API responses, and passwords are excluded from logs.

### JWT protection

JWTs are signed with the private `JWT_SECRET`, include the authenticated user's identity, and expire according to `JWT_EXPIRES_IN`. The secret is read from the environment and is never committed.

### Helmet

Helmet adds HTTP response headers that reduce common browser and API risks. Evidence can be captured from Postman's response headers, including `X-Content-Type-Options: nosniff` and the other headers appropriate to the response.

### Rate limiting

Rate limiting restricts how many requests one IP address can make during a time window. It reduces automated password guessing and request flooding.

- Signup and login are protected by the authentication limiter: 20 requests per 15 minutes by default.
- General API traffic is protected by the API limiter: 100 requests per 15 minutes by default.
- The limits and window are configurable through environment variables.
- Exceeding a limit returns JSON with `429 Too Many Requests`.

Run the Postman rate-limit folder last. Once the limit is reached, authentication requests from the same local IP remain blocked until the window resets or the development server is restarted.

### Environment and response safety

`.env`, connection credentials, generated logs, and `node_modules` are ignored by Git. Production-style errors avoid stack traces and sensitive implementation details. The API also limits JSON request size and does not use a client-provided user ID to make authorization decisions.

## HTTP status-code rationale

| Code | Meaning in this API |
| --- | --- |
| `200 OK` | A login, read, update, or health request completed successfully. |
| `201 Created` | A user or employee was created and the new resource information is returned. |
| `204 No Content` | An employee was deleted; no response representation is needed. |
| `400 Bad Request` | Input, JSON, query data, or an ObjectId is malformed or fails validation. |
| `401 Unauthorized` | Authentication is missing or unsuccessful, including invalid credentials or JWTs. |
| `403 Forbidden` | The user is authenticated but does not own the requested employee. |
| `404 Not Found` | The route or requested employee does not exist. |
| `409 Conflict` | A unique username or email is already registered. |
| `413 Payload Too Large` | The JSON request body exceeds the API's 100 KB limit. |
| `429 Too Many Requests` | A configured request limit was exceeded. |
| `500 Internal Server Error` | An unexpected server or database failure occurred; the response remains sanitized. |
| `503 Service Unavailable` | The serverless entry point could not establish a MongoDB connection. |

## Logging

Local development logs are written under the directory configured by `LOG_DIR` (default `logs/`). Logs contain useful operational information such as:

- ISO timestamp and log level;
- HTTP method, path, response status, and request duration;
- server startup and database connection events;
- successful operations;
- authentication attempts;
- validation and authorization failures;
- application errors.

Passwords, JWT secrets, database credentials, and full bearer tokens are intentionally excluded. Generated `.log` files are ignored by Git, while `logs/sample.log` is a sanitized example for repository and assignment evidence.

Vercel's filesystem is temporary, so local file logging is used for the assignment's local evidence. Deployed request output is also available in Vercel runtime logs.

## Health check

```http
GET /health
```

Expected status: `200 OK` while the application is running. The JSON response reports `status` (`ok` or `degraded`), an ISO timestamp, and the MongoDB connection state. This endpoint does not expose the MongoDB URI, credentials, JWT secret, or other private configuration.

Example:

```json
{
  "success": true,
  "status": "ok",
  "database": {
    "status": "connected"
  },
  "timestamp": "2026-10-14T18:00:00.000Z"
}
```

## Automated tests

Run all tests:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

The tests exercise successful endpoint behavior, validation errors, authentication failures, employee ownership, CRUD operations, status codes, and error response consistency. MongoDB Memory Server keeps automated tests separate from the local assignment database.

## Postman collection

Import:

```text
postman/COMP3123_Assignment1.postman_collection.json
```

The collection variable `baseUrl` defaults to `http://localhost:3000`. It creates two unique test users, saves `userAToken` and `userBToken`, saves employee IDs, checks exact status codes, verifies response safety, and performs cross-user ownership tests.

Recommended workflow:

1. Start MongoDB and the API.
2. Import the collection into Postman.
3. Clear the collection's current values if re-running it, especially `runSuffix`, tokens, employee IDs, and rate-test counters.
4. Run the entire collection in its numbered order with Postman Collection Runner.
5. Keep the rate-limit folder last. Its first request repeats until `429` is observed; the final request confirms an exact `429` response.
6. Review every automated test result and capture the required screenshots.

The folder names and request names can be used directly as screenshot headings.

### Reproducing an expired JWT in Postman

An expired token must have a valid signature from the running application; a made-up or modified token tests an invalid signature instead. The committed `expiredToken` variable is therefore blank, and no signing secret is stored in the collection.

To capture genuine `TOKEN_EXPIRED` evidence locally:

1. Complete the normal protected-route evidence first, but do not run the rate-limit folder yet.
2. Temporarily set `JWT_EXPIRES_IN=1s` in the private `.env` and restart the API.
3. Send the existing User A login request and copy its newly saved `userAToken` current value into the `expiredToken` collection variable.
4. Wait at least two seconds, then send `02.3 Expired JWT - 401 (manual token setup)`. Its test checks for the exact `TOKEN_EXPIRED` error code.
5. Restore `JWT_EXPIRES_IN=1h`, restart the API, and send the User A login request again before doing any additional protected requests.

The automated Jest suite also verifies the expired-token branch without storing a real secret or token in the repository.

## Non-sensitive marker credentials

The Postman collection appends a timestamp suffix to usernames and emails so a clean run does not conflict with old test data. The base credentials are:

| Account | Username pattern | Email pattern | Password |
| --- | --- | --- | --- |
| User A | `assignment_user_a_<runSuffix>` | `assignment.user.a.<runSuffix>@example.com` | `UserA#2026!Secure` |
| User B | `assignment_user_b_<runSuffix>` | `assignment.user.b.<runSuffix>@example.com` | `UserB#2026!Secure` |

These are assignment-only test accounts, not credentials used by a real person or another service.

## Vercel deployment

The project follows Vercel's current Express deployment approach. The root `app.js` exports the Express application, `server.js` handles the local listener, and `api/index.js` provides a serverless entry point that reuses the database connection. `vercel.json` is intentionally minimal.

1. Push the completed project to the public GitHub repository.
2. In Vercel, choose **Add New Project** and import that GitHub repository.
3. Keep the detected Node.js/Express build settings unless Vercel reports a project-specific issue.
4. Add production environment variables in Vercel Project Settings. At minimum add:
   - `NODE_ENV=production`
   - `MONGODB_URI=<MongoDB Atlas connection string>`
   - `MONGODB_DB_NAME=comp3123_assignment1`
   - `JWT_SECRET=<long random production secret>`
   - `JWT_EXPIRES_IN=1h`
5. Ensure the Atlas database user and network access settings permit the Vercel deployment to connect. Use a dedicated least-privilege database user and never place its credentials in Git.
6. Deploy and test `https://<deployment-domain>/health`.
7. Run the Postman collection again with `baseUrl` changed to the deployment URL, except the rate-limit folder until all other deployed evidence is complete.
8. Replace the Vercel placeholder near the top of this README with the final URL.

The official hosting reference supplied with the assignment is [Using Express.js with Vercel](https://vercel.com/guides/using-express-with-vercel).

## Evidence and submission workflow

Use [docs/SCREENSHOT_CHECKLIST.md](docs/SCREENSHOT_CHECKLIST.md) to capture and name evidence. The final DOCX should show:

- every success endpoint and exact status code;
- validation, duplicate, authentication, invalid-ID, not-found, and unsupported-route errors;
- missing, invalid, and expired-token behavior;
- two-user list isolation and cross-user read/update/delete rejection;
- the final `429` rate-limit response;
- Helmet response headers;
- health-check output;
- sanitized local logs;
- MongoDB database, collections, hashed password, and owner references;
- automated test results and the deployed health check.

Before submission:

- Add the GitHub and Vercel URLs to the README and DOCX.
- Export the final Postman collection.
- Put all labeled screenshots into one DOCX.
- Remove `node_modules` before creating the ZIP.
- Confirm `.env`, secrets, generated coverage, and private credentials are absent.
- Open the ZIP once to verify that it is valid.
- Submit the ZIP, screenshot DOCX, GitHub link, and deployed API URL through D2L before the deadline.

## Academic review notes

The important implementation decisions to be ready to explain are how bcrypt protects passwords, how JWT verification identifies a user, how Mongoose stores the user-to-employee relationship, why ownership is checked server-side, how request validation and centralized errors work, what Helmet and rate limiting provide, what is intentionally excluded from logs, and why each HTTP status code is used.
