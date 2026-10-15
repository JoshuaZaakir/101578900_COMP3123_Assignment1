const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const SIGNUP_URL = '/api/v1/user/signup';
const LOGIN_URL = '/api/v1/user/login';
const EMPLOYEES_URL = '/api/v1/emp/employees';

const userA = {
  username: 'joshua_test',
  email: 'joshua.test@example.com',
  password: 'StrongPass1!',
};

const userB = {
  username: 'taylor_test',
  email: 'taylor.test@example.com',
  password: 'AnotherPass2!',
};

const employeeA = {
  first_name: 'Avery',
  last_name: 'Morgan',
  email: 'avery.morgan@company.com',
  position: 'Software Developer',
  salary: 82000,
  date_of_joining: '2025-01-15',
  department: 'Engineering',
};

const employeeB = {
  first_name: 'Riley',
  last_name: 'Chen',
  email: 'riley.chen@company.com',
  position: 'Business Analyst',
  salary: 71000,
  date_of_joining: '2024-09-03',
  department: 'Operations',
};

let app;
let mongoose;
let User;
let Employee;
let mongoServer;
let ipSequence = 1;

function nextIp() {
  const thirdOctet = Math.floor(ipSequence / 250);
  const fourthOctet = (ipSequence % 250) + 1;
  ipSequence += 1;
  return `10.10.${thirdOctet}.${fourthOctet}`;
}

function fromIp(testRequest, ip = nextIp()) {
  return testRequest.set('X-Forwarded-For', ip);
}

function withToken(testRequest, token) {
  return testRequest.set('Authorization', `Bearer ${token}`);
}

function tokenFrom(body) {
  return body?.token ?? body?.data?.token;
}

function employeeFrom(body) {
  return body?.employee ?? body?.data?.employee ?? body?.data;
}

function employeesFrom(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.employees)) return body.employees;
  if (Array.isArray(body?.data?.employees)) return body.data.employees;
  if (Array.isArray(body?.data)) return body.data;
  return undefined;
}

function employeeIdFrom(body) {
  const employee = employeeFrom(body);
  return employee?._id ?? employee?.id;
}

function expectJsonError(response, status) {
  expect(response.status).toBe(status);
  expect(response.headers['content-type']).toMatch(/application\/json/i);
  expect(response.body).toEqual(expect.any(Object));
  expect(response.body.message ?? response.body.error?.message ?? response.body.error).toEqual(
    expect.any(String),
  );
}

async function signup(payload = userA, ip = nextIp()) {
  return fromIp(request(app).post(SIGNUP_URL).send(payload), ip);
}

async function login(payload, ip = nextIp()) {
  return fromIp(request(app).post(LOGIN_URL).send(payload), ip);
}

async function createAuthenticatedUser(user = userA, ip = nextIp()) {
  const signupResponse = await signup(user, ip);
  expect(signupResponse.status).toBe(201);

  const loginResponse = await login(
    { username: user.username, password: user.password },
    ip,
  );
  expect(loginResponse.status).toBe(200);

  const token = tokenFrom(loginResponse.body);
  expect(token).toEqual(expect.any(String));
  return token;
}

async function createEmployee(token, payload = employeeA, ip = nextIp()) {
  return fromIp(
    withToken(request(app).post(EMPLOYEES_URL), token).send(payload),
    ip,
  );
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'assignment-test-secret-that-is-long-enough';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.AUTH_RATE_LIMIT_MAX = '5';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.API_RATE_LIMIT_MAX = '500';

  mongoServer = await MongoMemoryServer.create({
    instance: { dbName: 'comp3123_assignment1' },
  });
  process.env.MONGODB_URI = mongoServer.getUri('comp3123_assignment1');

  app = require('../app');
  mongoose = require('mongoose');
  User = require('../src/models/User');
  Employee = require('../src/models/Employee');

  // Rate-limit tests use X-Forwarded-For to keep each test independent.
  app.set('trust proxy', 1);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterEach(async () => {
  await Promise.all([Employee.deleteMany({}), User.deleteMany({})]);
});

afterAll(async () => {
  if (mongoose?.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('API infrastructure and security headers', () => {
  test('GET /health reports that the service and database are available', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/i);
    expect(response.body).toEqual(expect.any(Object));
    expect(response.body.status ?? response.body.message).toEqual(expect.any(String));
  });

  test('Helmet adds common HTTP security headers', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/i);
    expect(response.headers['content-security-policy']).toEqual(expect.any(String));
  });

  test('rejects JWT secrets shorter than 32 UTF-8 bytes', async () => {
    const originalSecret = process.env.JWT_SECRET;
    const { getJwtSecret } = require('../src/services/tokenService');

    try {
      process.env.JWT_SECRET = 'too-short';
      expect(() => getJwtSecret()).toThrow(/at least 32 UTF-8 bytes/);

      const response = await request(app).post(SIGNUP_URL).send(userA);
      expectJsonError(response, 500);
      expect(response.body.error.code).toBe('CONFIGURATION_ERROR');
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }
  });
});

describe('POST /api/v1/user/signup', () => {
  test('creates a user, hashes the password, and does not expose it', async () => {
    const response = await signup();

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/application\/json/i);
    expect(JSON.stringify(response.body)).not.toContain(userA.password);
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('"password"');

    const savedUser = await User.findOne({ username: userA.username }).select('+password');
    expect(savedUser).not.toBeNull();
    expect(savedUser.password).not.toBe(userA.password);
    expect(await bcrypt.compare(userA.password, savedUser.password)).toBe(true);
  });

  test('rejects a duplicate username with 409 Conflict', async () => {
    expect((await signup()).status).toBe(201);

    const response = await signup({
      ...userA,
      email: 'different@example.com',
    });

    expectJsonError(response, 409);
  });

  test('rejects a duplicate email with 409 Conflict', async () => {
    expect((await signup()).status).toBe(201);

    const response = await signup({
      ...userA,
      username: 'different_user',
    });

    expectJsonError(response, 409);
  });

  test.each([
    ['missing required fields', { username: 'only_username' }],
    [
      'an invalid email',
      { username: 'valid_name', email: 'not-an-email', password: 'StrongPass1!' },
    ],
    [
      'a weak password',
      { username: 'valid_name', email: 'valid@example.com', password: 'weak' },
    ],
  ])('rejects %s with 400 Bad Request', async (_label, payload) => {
    const response = await signup(payload);
    expectJsonError(response, 400);
  });

  test('rejects passwords longer than 72 UTF-8 bytes', async () => {
    const response = await signup({
      username: 'unicode_password',
      email: 'unicode.password@example.com',
      password: `StrongPass1!${'é'.repeat(31)}`,
    });

    expectJsonError(response, 400);
    expect(JSON.stringify(response.body)).toMatch(/72 UTF-8 bytes/);
  });
});

describe('POST /api/v1/user/login', () => {
  beforeEach(async () => {
    expect((await signup()).status).toBe(201);
  });

  test('authenticates with username and returns a JWT', async () => {
    const response = await login({
      username: userA.username,
      password: userA.password,
    });

    expect(response.status).toBe(200);
    expect(tokenFrom(response.body)).toEqual(expect.any(String));
    expect(() => jwt.verify(tokenFrom(response.body), process.env.JWT_SECRET)).not.toThrow();
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('"password"');
  });

  test('authenticates with email and returns a JWT', async () => {
    const response = await login({
      email: userA.email,
      password: userA.password,
    });

    expect(response.status).toBe(200);
    expect(tokenFrom(response.body)).toEqual(expect.any(String));
  });

  test('rejects invalid credentials with 401 Unauthorized', async () => {
    const response = await login({
      username: userA.username,
      password: 'WrongPass9!',
    });

    expectJsonError(response, 401);
  });

  test.each([
    ['a missing password', { username: userA.username }],
    ['a missing username/email', { password: userA.password }],
    ['an empty body', {}],
  ])('rejects %s with 400 Bad Request', async (_label, payload) => {
    const response = await login(payload);
    expectJsonError(response, 400);
  });
});

describe('JWT protection for employee endpoints', () => {
  test('rejects a missing bearer token', async () => {
    const response = await request(app).get(EMPLOYEES_URL);
    expectJsonError(response, 401);
  });

  test('rejects employee creation when the bearer token is missing', async () => {
    const response = await request(app).post(EMPLOYEES_URL).send(employeeA);
    expectJsonError(response, 401);
    expect(await Employee.countDocuments()).toBe(0);
  });

  test('rejects an invalid bearer token', async () => {
    const response = await withToken(
      request(app).get(EMPLOYEES_URL),
      'not-a-valid-jwt',
    );
    expectJsonError(response, 401);
  });

  test('rejects a malformed Authorization header', async () => {
    const response = await request(app)
      .get(EMPLOYEES_URL)
      .set('Authorization', 'Token not-a-bearer-token');
    expectJsonError(response, 401);
  });

  test('rejects an expired bearer token', async () => {
    const expiredToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString() },
      process.env.JWT_SECRET,
      { expiresIn: -1 },
    );

    const response = await withToken(request(app).get(EMPLOYEES_URL), expiredToken);
    expectJsonError(response, 401);
  });
});

describe('Employee CRUD endpoints', () => {
  let token;

  beforeEach(async () => {
    token = await createAuthenticatedUser();
  });

  test('GET /employees returns only an array of the current user\'s employees', async () => {
    const response = await withToken(request(app).get(EMPLOYEES_URL), token);

    expect(response.status).toBe(200);
    expect(employeesFrom(response.body)).toEqual([]);
  });

  test('POST /employees creates an employee with server-controlled ownership', async () => {
    const response = await createEmployee(token);

    expect(response.status).toBe(201);
    expect(employeeFrom(response.body)).toEqual(
      expect.objectContaining({
        first_name: employeeA.first_name,
        last_name: employeeA.last_name,
        email: employeeA.email,
        salary: employeeA.salary,
      }),
    );

    const savedEmployee = await Employee.findOne({ email: employeeA.email });
    const savedUser = await User.findOne({ username: userA.username });
    expect(savedEmployee).not.toBeNull();
    expect(savedEmployee.user.toString()).toBe(savedUser._id.toString());
  });

  test('GET /employees/:eid returns the requested owned employee', async () => {
    const created = await createEmployee(token);
    const eid = employeeIdFrom(created.body);

    const response = await withToken(request(app).get(`${EMPLOYEES_URL}/${eid}`), token);

    expect(response.status).toBe(200);
    expect(employeeFrom(response.body)).toEqual(
      expect.objectContaining({
        _id: eid,
        email: employeeA.email,
      }),
    );
  });

  test('PUT /employees/:eid updates an owned employee', async () => {
    const created = await createEmployee(token);
    const eid = employeeIdFrom(created.body);

    const response = await withToken(
      request(app).put(`${EMPLOYEES_URL}/${eid}`),
      token,
    ).send({ position: 'Senior Software Developer', salary: 96000 });

    expect(response.status).toBe(200);
    expect(employeeFrom(response.body)).toEqual(
      expect.objectContaining({
        _id: eid,
        position: 'Senior Software Developer',
        salary: 96000,
      }),
    );
  });

  test('DELETE /employees?eid=... returns 204 with an empty body', async () => {
    const created = await createEmployee(token);
    const eid = employeeIdFrom(created.body);

    const response = await withToken(
      request(app).delete(EMPLOYEES_URL).query({ eid }),
      token,
    );

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expect(await Employee.findById(eid)).toBeNull();
  });
});

describe('Employee validation and not-found handling', () => {
  let token;

  beforeEach(async () => {
    token = await createAuthenticatedUser();
  });

  test.each([
    ['missing required fields', { first_name: 'Only' }],
    ['an invalid email', { ...employeeA, email: 'invalid-email' }],
    ['a non-numeric salary', { ...employeeA, salary: 'a lot' }],
    ['a non-positive salary', { ...employeeA, salary: 0 }],
    ['an invalid date', { ...employeeA, date_of_joining: 'not-a-date' }],
  ])('POST /employees rejects %s', async (_label, payload) => {
    const response = await createEmployee(token, payload);
    expectJsonError(response, 400);
  });

  test.each([
    ['GET', () => withToken(request(app).get(`${EMPLOYEES_URL}/not-an-id`), token)],
    [
      'PUT',
      () =>
        withToken(request(app).put(`${EMPLOYEES_URL}/not-an-id`), token).send({
          position: 'Manager',
        }),
    ],
    [
      'DELETE',
      () => withToken(request(app).delete(EMPLOYEES_URL).query({ eid: 'not-an-id' }), token),
    ],
  ])('%s rejects an invalid employee ID with 400', async (_method, makeRequest) => {
    const response = await makeRequest();
    expectJsonError(response, 400);
  });

  test('DELETE rejects a missing eid query parameter with 400', async () => {
    const response = await withToken(request(app).delete(EMPLOYEES_URL), token);
    expectJsonError(response, 400);
  });

  test('PUT rejects an invalid update body with 400', async () => {
    const created = await createEmployee(token);
    const eid = employeeIdFrom(created.body);

    const response = await withToken(
      request(app).put(`${EMPLOYEES_URL}/${eid}`),
      token,
    ).send({ email: 'invalid-email', salary: -50, date_of_joining: 'invalid' });

    expectJsonError(response, 400);
  });

  test.each([
    ['GET', (eid) => withToken(request(app).get(`${EMPLOYEES_URL}/${eid}`), token)],
    [
      'PUT',
      (eid) =>
        withToken(request(app).put(`${EMPLOYEES_URL}/${eid}`), token).send({
          position: 'Manager',
        }),
    ],
    [
      'DELETE',
      (eid) => withToken(request(app).delete(EMPLOYEES_URL).query({ eid }), token),
    ],
  ])('%s returns 404 for a valid but unknown employee ID', async (_method, makeRequest) => {
    const eid = new mongoose.Types.ObjectId().toString();
    const response = await makeRequest(eid);
    expectJsonError(response, 404);
  });
});

describe('Employee ownership authorization', () => {
  let tokenA;
  let tokenB;
  let savedUserA;
  let savedUserB;

  beforeEach(async () => {
    tokenA = await createAuthenticatedUser(userA);
    tokenB = await createAuthenticatedUser(userB);
    savedUserA = await User.findOne({ username: userA.username });
    savedUserB = await User.findOne({ username: userB.username });
  });

  test('lists are isolated by the authenticated user', async () => {
    expect((await createEmployee(tokenA, employeeA)).status).toBe(201);
    expect((await createEmployee(tokenB, employeeB)).status).toBe(201);

    const responseA = await withToken(request(app).get(EMPLOYEES_URL), tokenA);
    const responseB = await withToken(request(app).get(EMPLOYEES_URL), tokenB);

    expect(responseA.status).toBe(200);
    expect(employeesFrom(responseA.body)).toHaveLength(1);
    expect(employeesFrom(responseA.body)[0].email).toBe(employeeA.email);
    expect(responseB.status).toBe(200);
    expect(employeesFrom(responseB.body)).toHaveLength(1);
    expect(employeesFrom(responseB.body)[0].email).toBe(employeeB.email);
  });

  test('both users receive 403 for cross-user GET, PUT, and DELETE attempts', async () => {
    const createdA = await createEmployee(tokenA, employeeA);
    const createdB = await createEmployee(tokenB, employeeB);
    const eidA = employeeIdFrom(createdA.body);
    const eidB = employeeIdFrom(createdB.body);

    const attempts = [
      withToken(request(app).get(`${EMPLOYEES_URL}/${eidB}`), tokenA),
      withToken(request(app).put(`${EMPLOYEES_URL}/${eidB}`), tokenA).send({
        position: 'Unauthorized change',
      }),
      withToken(request(app).delete(EMPLOYEES_URL).query({ eid: eidB }), tokenA),
      withToken(request(app).get(`${EMPLOYEES_URL}/${eidA}`), tokenB),
      withToken(request(app).put(`${EMPLOYEES_URL}/${eidA}`), tokenB).send({
        position: 'Unauthorized change',
      }),
      withToken(request(app).delete(EMPLOYEES_URL).query({ eid: eidA }), tokenB),
    ];

    const responses = await Promise.all(attempts);
    for (const response of responses) {
      expectJsonError(response, 403);
    }

    expect((await Employee.findById(eidA)).position).toBe(employeeA.position);
    expect((await Employee.findById(eidB)).position).toBe(employeeB.position);
  });

  test('client-supplied ownership fields are ignored or rejected', async () => {
    const response = await createEmployee(tokenA, {
      ...employeeA,
      user: savedUserB._id.toString(),
      owner: savedUserB._id.toString(),
      created_by: savedUserB._id.toString(),
    });

    expect([201, 400]).toContain(response.status);
    const savedEmployee = await Employee.findOne({ email: employeeA.email });
    if (response.status === 201) {
      expect(savedEmployee.user.toString()).toBe(savedUserA._id.toString());
    } else {
      expect(savedEmployee).toBeNull();
    }
  });

  test('an update cannot transfer employee ownership', async () => {
    const created = await createEmployee(tokenA, employeeA);
    const eid = employeeIdFrom(created.body);

    const response = await withToken(
      request(app).put(`${EMPLOYEES_URL}/${eid}`),
      tokenA,
    ).send({ user: savedUserB._id.toString(), owner: savedUserB._id.toString() });

    expect([200, 400]).toContain(response.status);
    const savedEmployee = await Employee.findById(eid);
    expect(savedEmployee.user.toString()).toBe(savedUserA._id.toString());
  });
});

describe('General error handling and rate limiting', () => {
  test('unsupported routes return a JSON 404 response', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');
    expectJsonError(response, 404);
  });

  test('malformed JSON returns a safe JSON 400 response', async () => {
    const response = await request(app)
      .post(SIGNUP_URL)
      .set('Content-Type', 'application/json')
      .set('X-Forwarded-For', nextIp())
      .send('{"username":');

    expectJsonError(response, 400);
    expect(JSON.stringify(response.body)).not.toMatch(/SyntaxError|at\s+\w+\s+\(/);
  });

  test('authentication rate limiting returns 429 after the configured limit', async () => {
    const rateLimitIp = '10.200.0.1';
    const responses = [];

    for (let attempt = 0; attempt < 11; attempt += 1) {
      responses.push(
        await login(
          { username: 'unknown_user', password: 'WrongPass9!' },
          rateLimitIp,
        ),
      );
    }

    const firstLimitedIndex = responses.findIndex((response) => response.status === 429);
    expect(firstLimitedIndex).toBeGreaterThanOrEqual(5);
    expect(firstLimitedIndex).toBeLessThanOrEqual(10);
    expectJsonError(responses[firstLimitedIndex], 429);
  });
});
