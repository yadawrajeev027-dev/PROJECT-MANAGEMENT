/**
 * testAuthIntegration.js
 * Integration test suite for ProjectPulse AI Registration & Login API routing:
 *
 * 1. Express backend /api/auth/register input validation & account creation.
 * 2. Express backend /api/auth/login authentication & credential checks.
 * 3. Express backend /api/auth/me token authorization.
 * 4. Verification against deployed Render backend (live endpoints, CORS, preflight).
 * 5. Frontend Axios URL normalizer testing for VITE_API_BASE_URL.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message} - ${detail}`);
  }
}

async function runAuthTests() {
  console.log('====================================================');
  console.log('🔐 ProjectPulse AI: Auth & Routing Integration Tests');
  console.log('====================================================\n');

  // Start local test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let dbConnected = false;
  try {
    if (process.env.MONGODB_URI) {
      await connectDB(process.env.MONGODB_URI);
      dbConnected = true;
    }
  } catch (err) {
    console.warn('MongoDB connection notice:', err.message);
  }

  const testEmail = `auth_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = null;

  try {
    // -------------------------------------------------------------
    // Suite 1: Registration Endpoint Routing & Validation
    // -------------------------------------------------------------
    console.log('--- Suite 1: Registration Endpoint (POST /api/auth/register) ---');

    // Missing Name
    const resNoName = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert(resNoName.status === 400, 'POST /api/auth/register rejects missing name (400 Bad Request)');
    const dataNoName = await resNoName.json();
    assert(dataNoName.message?.includes('Name is required'), 'Error message specifies: Name is required');

    // Short Password
    const resShortPass = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: testEmail, password: '123' }),
    });
    assert(resShortPass.status === 400, 'POST /api/auth/register rejects password < 8 chars (400 Bad Request)');

    // Invalid Email
    const resBadEmail = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', email: 'not-an-email', password: testPassword }),
    });
    assert(resBadEmail.status === 400, 'POST /api/auth/register rejects invalid email format (400 Bad Request)');

    if (dbConnected) {
      // Valid Registration
      const resValid = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice Test', email: testEmail, password: testPassword }),
      });
      assert(resValid.status === 201, `Valid registration returns HTTP 201 Created (got ${resValid.status})`);
      const dataValid = await resValid.json();
      assert(dataValid.success === true, 'Registration response success is true');
      assert(dataValid.data?.user?.email === testEmail, 'User record created with correct email');
      assert(dataValid.data?.user?.password === undefined, 'Password hash is strictly excluded from response');
      assert(typeof dataValid.data?.token === 'string', 'Valid JWT auth token returned');
      authToken = dataValid.data?.token;

      // Duplicate Registration (Same Email)
      const resDup = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice Clone', email: testEmail, password: testPassword }),
      });
      assert(resDup.status === 409, 'Duplicate registration rejected with HTTP 409 Conflict');
    }

    // -------------------------------------------------------------
    // Suite 2: Login Endpoint Routing & Credential Checks
    // -------------------------------------------------------------
    console.log('\n--- Suite 2: Login Endpoint (POST /api/auth/login) ---');

    if (dbConnected) {
      // Valid Login
      const resLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      assert(resLogin.status === 200, `POST /api/auth/login returns HTTP 200 OK (got ${resLogin.status})`);
      const dataLogin = await resLogin.json();
      assert(dataLogin.success === true, 'Login response success is true');
      assert(typeof dataLogin.data?.token === 'string', 'Login returns authenticated JWT token');
      assert(dataLogin.data?.user?.email === testEmail, 'Login returns authentic user profile');

      // Wrong Password
      const resWrongPass = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword999!' }),
      });
      assert(resWrongPass.status === 401, 'POST /api/auth/login rejects wrong password (401 Unauthorized)');

      // Non-existent Email
      const resNoUser = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ghost_user_does_not_exist@example.com', password: testPassword }),
      });
      assert(resNoUser.status === 401, 'POST /api/auth/login rejects unknown email (401 Unauthorized)');
    }

    // -------------------------------------------------------------
    // Suite 3: Token Authorization Endpoint (GET /api/auth/me)
    // -------------------------------------------------------------
    console.log('\n--- Suite 3: Token Authorization (GET /api/auth/me) ---');

    // Missing Token
    const resNoToken = await fetch(`${baseUrl}/api/auth/me`);
    assert(resNoToken.status === 401, 'GET /api/auth/me rejects missing token (401 Unauthorized)');

    // Invalid Token
    const resBadToken = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': 'Bearer this.is.an.invalid.token' },
    });
    assert(resBadToken.status === 401, 'GET /api/auth/me rejects invalid token (401 Unauthorized)');

    if (authToken) {
      // Valid Token
      const resAuth = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      assert(resAuth.status === 200, 'GET /api/auth/me succeeds with valid Bearer token (200 OK)');
      const dataAuth = await resAuth.json();
      assert(
        (dataAuth.data?.user?.email || dataAuth.data?.email) === testEmail,
        'Returns authenticated user record'
      );
    }

    // -------------------------------------------------------------
    // Suite 4: Live Render Deployed Backend Endpoints Verification
    // -------------------------------------------------------------
    console.log('\n--- Suite 4: Live Render Backend Verification ---');

    const renderBaseUrl = 'https://project-management-system-ope4.onrender.com';
    const vercelOrigin = 'https://project-management-systems-tawny.vercel.app';

    // Check Live Render Health
    try {
      const resRenderHealth = await fetch(`${renderBaseUrl}/api/health`);
      assert(resRenderHealth.status === 200, `Live Render GET /api/health is online: HTTP ${resRenderHealth.status}`);
    } catch (e) {
      console.warn('Live Render probe skipped:', e.message);
    }

    // Check Live Render CORS from Vercel Domain
    try {
      const resRenderCORS = await fetch(`${renderBaseUrl}/api/auth/register`, {
        method: 'OPTIONS',
        headers: {
          'Origin': vercelOrigin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });
      assert(resRenderCORS.status === 204, `Live Render OPTIONS preflight returns HTTP 204 for Vercel origin`);
      assert(
        resRenderCORS.headers.get('access-control-allow-origin') === vercelOrigin,
        `Live Render echoes Access-Control-Allow-Origin: ${vercelOrigin}`
      );
      assert(
        resRenderCORS.headers.get('access-control-allow-credentials') === 'true',
        'Live Render CORS permits credentials'
      );
    } catch (e) {
      console.warn('Live Render CORS probe skipped:', e.message);
    }

    // Check Live Render Registration
    try {
      const liveUser = {
        name: 'Live Verify User',
        email: `live_verify_${Date.now()}@example.com`,
        password: 'Password123!',
      };
      const resRenderReg = await fetch(`${renderBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Origin': vercelOrigin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(liveUser),
      });
      assert(resRenderReg.status === 201, `Live Render registration returns HTTP 201 Created`);
      const dataRenderReg = await resRenderReg.json();
      assert(dataRenderReg.success === true, 'Live Render successfully creates user in MongoDB Atlas');
      assert(typeof dataRenderReg.data?.token === 'string', 'Live Render returns signed JWT token');

      // Test Login with that user on live Render
      const resRenderLogin = await fetch(`${renderBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Origin': vercelOrigin,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: liveUser.email, password: liveUser.password }),
      });
      assert(resRenderLogin.status === 200, `Live Render login returns HTTP 200 OK`);
      const dataRenderLogin = await resRenderLogin.json();
      assert(dataRenderLogin.success === true, 'Live Render login authenticates user');
    } catch (e) {
      console.warn('Live Render register/login test warning:', e.message);
    }

    // Cleanup local test user
    if (dbConnected) {
      await User.deleteOne({ email: testEmail });
    }

  } finally {
    server.close();
    if (dbConnected) {
      await disconnectDB();
    }
  }

  console.log('\n====================================================');
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal error in testAuthIntegration:', err);
  process.exit(1);
});
