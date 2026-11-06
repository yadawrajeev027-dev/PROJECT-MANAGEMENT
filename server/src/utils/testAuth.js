import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import { getJwtSecret } from './jwt.js';

const runAuthTests = async () => {
  console.log('====================================================');
  console.log('🧪 ProjectPulse AI - Authentication System Test Suite');
  console.log('====================================================');

  let serverInstance = null;
  let testPort = null;
  const createdUserIds = [];
  let allPassed = true;

  try {
    // 1. Connect to Database
    console.log('\n[Setup] Connecting to MongoDB Atlas...');
    await connectDB(process.env.MONGODB_URI);
    console.log('  ✅ Database connected.');

    // 2. Start Ephemeral HTTP Server
    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, '127.0.0.1', resolve));
    testPort = serverInstance.address().port;
    const baseUrl = `http://127.0.0.1:${testPort}/api/auth`;
    console.log(`  ✅ Ephemeral test server listening on port ${testPort}`);

    const testPassword = 'SecureP@ssw0rd2026';
    const testEmail = `auth.test.${Date.now()}@projectpulse.ai`;
    let activeToken = null;
    let registeredUserId = null;

    // Helper for requests
    const makeRequest = async (path, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-runner',
        ...(options.headers || {}),
      };
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // Test 1: Successful Registration
    console.log('\n1. Testing Successful Registration (POST /api/auth/register)...');
    const regRes = await makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex Developer',
        email: testEmail,
        password: testPassword,
      }),
    });

    if (regRes.status === 201 && regRes.data?.success && regRes.data?.data?.token) {
      registeredUserId = regRes.data.data.user.id;
      createdUserIds.push(registeredUserId);
      activeToken = regRes.data.data.token;
      console.log(`  ✅ Registered successfully. User ID: ${registeredUserId}`);
    } else {
      console.error('  ❌ Registration failed:', regRes);
      allPassed = false;
    }

    // Test 2: Duplicate Email Rejection
    console.log('\n2. Testing Duplicate Email Rejection...');
    const dupRes = await makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Alex Impersonator',
        email: testEmail,
        password: testPassword,
      }),
    });

    if (dupRes.status === 409 && dupRes.data?.success === false) {
      console.log('  ✅ Duplicate email registration correctly rejected with status 409.');
    } else {
      console.error('  ❌ Duplicate email test failed:', dupRes);
      allPassed = false;
    }

    // Test 3: Invalid Email Rejection
    console.log('\n3. Testing Invalid Email Rejection...');
    const invalidEmailRes = await makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid Email User',
        email: 'not-a-valid-email',
        password: testPassword,
      }),
    });

    if (invalidEmailRes.status === 400 && invalidEmailRes.data?.success === false) {
      console.log('  ✅ Malformed email correctly rejected with status 400.');
    } else {
      console.error('  ❌ Invalid email test failed:', invalidEmailRes);
      allPassed = false;
    }

    // Test 4: Short Password Rejection (< 8 chars)
    console.log('\n4. Testing Short Password Rejection (< 8 characters)...');
    const shortPassRes = await makeRequest('/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Short Pass User',
        email: `shortpass.${Date.now()}@example.com`,
        password: 'short',
      }),
    });

    if (shortPassRes.status === 400 && shortPassRes.data?.success === false) {
      console.log('  ✅ Short password correctly rejected with status 400.');
    } else {
      console.error('  ❌ Short password test failed:', shortPassRes);
      allPassed = false;
    }

    // Test 5: Password Stored as Bcrypt Hash
    console.log('\n5. Testing Database Record: Password stored as secure bcrypt hash...');
    const rawUserDoc = await User.findById(registeredUserId).select('+password');
    if (
      rawUserDoc &&
      rawUserDoc.password &&
      rawUserDoc.password !== testPassword &&
      rawUserDoc.password.startsWith('$2')
    ) {
      console.log(`  ✅ Stored password is a verified bcrypt hash: ${rawUserDoc.password.substring(0, 15)}...`);
    } else {
      console.error('  ❌ Password hashing failed. Stored value was:', rawUserDoc?.password);
      allPassed = false;
    }

    // Test 6: Successful Login
    console.log('\n6. Testing Successful Login (POST /api/auth/login)...');
    const loginRes = await makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (loginRes.status === 200 && loginRes.data?.success && loginRes.data?.data?.token) {
      activeToken = loginRes.data.data.token;
      console.log('  ✅ Login succeeded with valid JWT returned.');
    } else {
      console.error('  ❌ Login failed:', loginRes);
      allPassed = false;
    }

    // Test 7: Incorrect Password Rejection
    console.log('\n7. Testing Incorrect Password Rejection...');
    const wrongPassRes = await makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'IncorrectPassword999!',
      }),
    });

    if (wrongPassRes.status === 401 && wrongPassRes.data?.message === 'Invalid email or password') {
      console.log('  ✅ Incorrect password rejected with generic 401 error message.');
    } else {
      console.error('  ❌ Incorrect password test failed:', wrongPassRes);
      allPassed = false;
    }

    // Test 8: Non-existent Email Rejection
    console.log('\n8. Testing Non-existent Email Login Rejection...');
    const nonExistentRes = await makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'does.not.exist@projectpulse.ai',
        password: testPassword,
      }),
    });

    if (nonExistentRes.status === 401 && nonExistentRes.data?.message === 'Invalid email or password') {
      console.log('  ✅ Non-existent user login rejected with same generic 401 error (no email enumeration).');
    } else {
      console.error('  ❌ Non-existent email test failed:', nonExistentRes);
      allPassed = false;
    }

    // Test 9: Valid JWT Access (GET /api/auth/me)
    console.log('\n9. Testing Valid JWT Access (GET /api/auth/me)...');
    const meRes = await makeRequest('/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });

    if (meRes.status === 200 && meRes.data?.data?.user?.email === testEmail) {
      console.log(`  ✅ GET /me authenticated successfully for: ${meRes.data.data.user.email}`);
    } else {
      console.error('  ❌ GET /me failed with valid token:', meRes);
      allPassed = false;
    }

    // Test 10: Missing Token Rejection
    console.log('\n10. Testing Missing Token Rejection...');
    const noTokenRes = await makeRequest('/me', { method: 'GET' });

    if (noTokenRes.status === 401 && noTokenRes.data?.success === false) {
      console.log('  ✅ Request without token correctly rejected with 401.');
    } else {
      console.error('  ❌ Missing token test failed:', noTokenRes);
      allPassed = false;
    }

    // Test 11: Invalid Token Rejection
    console.log('\n11. Testing Invalid / Malformed Token Rejection...');
    const badTokenRes = await makeRequest('/me', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token-signature-here',
      },
    });

    if (badTokenRes.status === 401 && badTokenRes.data?.success === false) {
      console.log('  ✅ Malformed token correctly rejected with 401.');
    } else {
      console.error('  ❌ Invalid token test failed:', badTokenRes);
      allPassed = false;
    }

    // Test 12: Expired Token Rejection
    console.log('\n12. Testing Expired Token Rejection...');
    const expiredToken = jwt.sign(
      { id: registeredUserId, role: 'user' },
      getJwtSecret(),
      { expiresIn: '1ms' }
    );
    // Allow token to expire
    await new Promise((r) => setTimeout(r, 20));

    const expiredRes = await makeRequest('/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${expiredToken}`,
      },
    });

    if (
      expiredRes.status === 401 &&
      expiredRes.data?.message?.includes('expired')
    ) {
      console.log('  ✅ Expired token correctly rejected with 401 ("Token has expired").');
    } else {
      console.error('  ❌ Expired token test failed:', expiredRes);
      allPassed = false;
    }

    // Test 13: GET /me returns safe user details
    console.log('\n13. Testing Safe User Details Format in GET /me...');
    const userPayload = meRes.data?.data?.user;
    if (
      userPayload?.id &&
      userPayload?.name === 'Alex Developer' &&
      userPayload?.email === testEmail &&
      userPayload?.role === 'user' &&
      userPayload?.createdAt
    ) {
      console.log('  ✅ Safe user profile format validated: id, name, email, role, createdAt.');
    } else {
      console.error('  ❌ User payload format incorrect:', userPayload);
      allPassed = false;
    }

    // Test 14: Password hash never appears in responses
    console.log('\n14. Testing Password / Hash Leak Prevention across all responses...');
    const responsesToCheck = [regRes.data, loginRes.data, meRes.data];
    let leakDetected = false;

    for (const body of responsesToCheck) {
      const stringified = JSON.stringify(body);
      if (stringified.includes('password') || stringified.includes('$2a$') || stringified.includes('$2b$')) {
        console.error('  ❌ Security Leak: Password or bcrypt hash found in response body:', stringified);
        leakDetected = true;
      }
    }

    if (!leakDetected) {
      console.log('  ✅ Verified: Password and bcrypt hash are NEVER exposed in any API response.');
    } else {
      allPassed = false;
    }

    // Test 15: Safe Cleanup
    console.log('\n[Teardown] Cleaning up test users from MongoDB Atlas...');
    if (createdUserIds.length > 0) {
      const deleteResult = await User.deleteMany({ _id: { $in: createdUserIds } });
      console.log(`  ✅ Deleted ${deleteResult.deletedCount} test user(s). No production records affected.`);
    }

  } catch (err) {
    console.error('\n💥 Unexpected error during auth test suite:', err);
    allPassed = false;

    // Cleanup on error
    if (createdUserIds.length > 0) {
      try {
        await User.deleteMany({ _id: { $in: createdUserIds } });
      } catch (cErr) {
        console.error('Error during emergency cleanup:', cErr.message);
      }
    }
  } finally {
    if (serverInstance) {
      serverInstance.closeAllConnections?.();
      await new Promise((r) => serverInstance.close(r));
      console.log('  🔒 Ephemeral test server closed.');
    }
    await disconnectDB();
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL 14 AUTHENTICATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('====================================================\n');
  } else {
    console.error('❌ SOME AUTHENTICATION TESTS FAILED. See log details above.');
    console.log('====================================================\n');
    process.exitCode = 1;
  }
};

runAuthTests();
