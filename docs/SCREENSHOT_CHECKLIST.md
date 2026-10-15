# Assignment 1 Screenshot Checklist

Use this checklist after the API works locally and before creating the final DOCX. Keep Postman's request method, URL, request body (when applicable), response status, and response body visible in each screenshot. Use only the non-sensitive sample accounts from the README. Never expose `.env`, a MongoDB connection string, `JWT_SECRET`, a database password, or a full bearer token.

## Recommended DOCX title

`101578900_COMP3123_Assignment1_API_Evidence.docx`

## Suggested evidence order and screenshot titles

- [ ] **01 - Health Check - 200 OK** — `GET /health` and successful JSON response.
- [ ] **02 - Unsupported Route - 404 Not Found** — JSON error for an unknown endpoint.
- [ ] **03 - User A Signup - 201 Created** — valid registration; verify no password is returned.
- [ ] **04 - Duplicate Username - 409 Conflict**.
- [ ] **05 - Duplicate Email - 409 Conflict**.
- [ ] **06 - Invalid Signup Data - 400 Bad Request** — invalid email/password or missing fields.
- [ ] **07 - User A Login by Username - 200 OK** — JWT returned; redact most of the token in the document if it is visible.
- [ ] **08 - User B Login by Email - 200 OK** — demonstrates the second supported login method.
- [ ] **09 - Invalid Login - 401 Unauthorized**.
- [ ] **10 - Missing JWT - 401 Unauthorized** — request to a protected employee route.
- [ ] **11 - Invalid JWT - 401 Unauthorized**.
- [ ] **11A - Expired JWT - 401 Unauthorized** — use the README's one-second JWT procedure and show the `TOKEN_EXPIRED` error code.
- [ ] **12 - User A Creates Employee - 201 Created**.
- [ ] **13 - Employee Validation Error - 400 Bad Request** — invalid email, salary, date, or missing field.
- [ ] **14 - User A Employee List - 200 OK** — only User A's records appear.
- [ ] **15 - User A Gets Own Employee - 200 OK**.
- [ ] **16 - User A Updates Own Employee - 200 OK**.
- [ ] **17 - User A Deletes Own Disposable Employee - 204 No Content** — the response body should be empty.
- [ ] **18 - Invalid Employee ID - 400 Bad Request**.
- [ ] **19 - Employee Not Found - 404 Not Found**.
- [ ] **20 - User B Creates Employee - 201 Created**.
- [ ] **21 - User B Employee List - 200 OK** — User A's records must not appear.
- [ ] **22 - User A Cannot Read User B Employee - 403 Forbidden**.
- [ ] **23 - User A Cannot Update User B Employee - 403 Forbidden**.
- [ ] **24 - User A Cannot Delete User B Employee - 403 Forbidden**.
- [ ] **25 - User B Cannot Read User A Employee - 403 Forbidden**.
- [ ] **26 - Rate Limit Exceeded - 429 Too Many Requests** — run this last because the limiter temporarily blocks signup/login calls.
- [ ] **27 - Helmet Security Headers** — show headers such as `X-Content-Type-Options: nosniff` on a successful response.
- [ ] **28 - Local Application Log** — show generated log entries without passwords, secrets, or full tokens.
- [ ] **29 - MongoDB Database** — show database name `comp3123_assignment1`.
- [ ] **30 - MongoDB Users Collection** — show the two test users and hashed (not plain-text) passwords.
- [ ] **31 - MongoDB Employees Collection** — show User A and User B employees with different owner references.
- [ ] **32 - User/Employee Relationship** — make the `user` ownership ObjectId visible and connect it to the correct user `_id`.
- [ ] **33 - Automated Test Results** — show `npm test` passing.
- [ ] **34 - Coverage Results** — show `npm run test:coverage` if included in the final evidence.
- [ ] **35 - Deployed Vercel Health Check** — use the deployed `/health` URL.

## DOCX presentation notes

1. Add a cover page with the course, assignment, name, student number, GitHub link, deployed API URL, and submission date.
2. Give every screenshot a numbered heading matching the list above.
3. Add one short sentence under each image explaining the expected result and why its status code is correct.
4. Crop screenshots only enough to remove unrelated desktop content; keep the evidence itself readable.
5. Recheck that no secrets or real personal information are visible before submission.

## Final submission check

- [ ] GitHub repository is public and named `101578900_COMP3123_Assignment1`.
- [ ] README includes the deployed URL and sample marker credentials.
- [ ] Exported Postman collection is included under `postman/`.
- [ ] Screenshots are combined into one clearly titled DOCX.
- [ ] ZIP contains the source, README, Postman collection, and configuration files.
- [ ] `node_modules`, `.env`, generated coverage, and private credentials are absent from the ZIP.
- [ ] The final ZIP opens successfully before upload.
