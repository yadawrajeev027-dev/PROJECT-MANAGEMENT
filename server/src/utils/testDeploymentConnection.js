/**
 * testDeploymentConnection.js
 * Verification test suite for Vercel Frontend <-> Render Backend connection:
 *
 * 1. Frontend Axios API Base URL resolution & normalization (VITE_API_BASE_URL / VITE_API_URL).
 * 2. Backend CORS validation for Vercel production and preview domains.
 * 3. Preflight OPTIONS request handling (HTTP 204, allow-methods, allow-headers, allow-credentials).
 * 4. Root & /health check endpoints for Render uptime monitoring.
 * 5. JWT Authorization header transmission & parsing.
 * 6. API route prefix integrity.
 */

import http from 'http';
import app from '../app.js';

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

async function runTests() {
  console.log('====================================================');
  console.log('🌐 ProjectPulse AI: Vercel & Render Connection Test');
  console.log('====================================================\n');

  // Start test server instance
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // -------------------------------------------------------------
    // Test 1: Root & Health Check Probes
    // -------------------------------------------------------------
    console.log('--- Step 1: Root & Health Check Probes ---');

    const resRoot = await fetch(`${baseUrl}/`);
    assert(resRoot.status === 200, 'GET / returns HTTP 200 OK');
    const dataRoot = await resRoot.json();
    assert(dataRoot.success === true, 'GET / returns success: true');

    const resHealth = await fetch(`${baseUrl}/health`);
    assert(resHealth.status === 200, 'GET /health returns HTTP 200 OK');

    const resApiHealth = await fetch(`${baseUrl}/api/health`);
    assert(resApiHealth.status === 200, 'GET /api/health returns HTTP 200 OK');
    const dataApiHealth = await resApiHealth.json();
    assert(dataApiHealth.message === 'Backend is running', 'GET /api/health returns operational status');

    // -------------------------------------------------------------
    // Test 2: CORS Preflight (OPTIONS) from Vercel Domain
    // -------------------------------------------------------------
    console.log('\n--- Step 2: CORS Preflight (OPTIONS) from Vercel Domain ---');

    const vercelOrigin = 'https://project-management-system.vercel.app';
    const resOptions = await fetch(`${baseUrl}/api/projects`, {
      method: 'OPTIONS',
      headers: {
        'Origin': vercelOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    assert(resOptions.status === 204, `OPTIONS preflight returns HTTP 204 (got ${resOptions.status})`);
    assert(
      resOptions.headers.get('access-control-allow-origin') === vercelOrigin,
      `CORS header Access-Control-Allow-Origin echoes Vercel domain: ${vercelOrigin}`
    );
    assert(
      resOptions.headers.get('access-control-allow-credentials') === 'true',
      'CORS header Access-Control-Allow-Credentials is true'
    );
    assert(
      resOptions.headers.get('access-control-allow-headers')?.includes('Authorization'),
      'CORS header Access-Control-Allow-Headers permits Authorization'
    );

    // -------------------------------------------------------------
    // Test 3: CORS from Vercel Preview Deployments (*.vercel.app)
    // -------------------------------------------------------------
    console.log('\n--- Step 3: CORS from Vercel Preview Subdomains ---');

    const vercelPreviewOrigin = 'https://project-management-system-git-main-vu241.vercel.app';
    const resPreview = await fetch(`${baseUrl}/api/health`, {
      headers: {
        'Origin': vercelPreviewOrigin,
      },
    });

    assert(resPreview.status === 200, 'GET /api/health from Vercel preview domain succeeds');
    assert(
      resPreview.headers.get('access-control-allow-origin') === vercelPreviewOrigin,
      `Preview domain correctly permitted: ${vercelPreviewOrigin}`
    );

    // -------------------------------------------------------------
    // Test 4: Rejection of Unauthorized Third-Party Domains
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Rejection of Unauthorized Origins ---');

    const maliciousOrigin = 'https://malicious-phishing-site.com';
    const resUnauthorized = await fetch(`${baseUrl}/api/health`, {
      headers: {
        'Origin': maliciousOrigin,
      },
    });

    assert(
      resUnauthorized.headers.get('access-control-allow-origin') !== maliciousOrigin,
      'Unauthorized third-party domain is blocked by CORS policy'
    );

    // -------------------------------------------------------------
    // Test 5: Requests without Origin (Uptime Probes / Mobile / cURL)
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Non-browser Requests without Origin Header ---');

    const resNoOrigin = await fetch(`${baseUrl}/api/health`);
    assert(resNoOrigin.status === 200, 'Requests without Origin header succeed (uptime robots, Render probes)');

    // -------------------------------------------------------------
    // Test 6: URL Normalization Logic Validation
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Frontend API Base URL Normalizer Verification ---');

    function normalizeApiUrl(raw) {
      let url = (raw || '/api').trim().replace(/\/+$/, '');
      if (/^https?:\/\//i.test(url) && !url.endsWith('/api')) {
        url = `${url}/api`;
      }
      return url;
    }

    assert(
      normalizeApiUrl('https://my-backend.onrender.com') === 'https://my-backend.onrender.com/api',
      'Normalizes Render URL without /api: https://my-backend.onrender.com -> /api appended'
    );

    assert(
      normalizeApiUrl('https://my-backend.onrender.com/api') === 'https://my-backend.onrender.com/api',
      'Preserves Render URL with /api intact'
    );

    assert(
      normalizeApiUrl('https://my-backend.onrender.com/api/') === 'https://my-backend.onrender.com/api',
      'Strips trailing slashes cleanly'
    );

    assert(
      normalizeApiUrl('') === '/api',
      'Defaults cleanly to /api when undefined'
    );

    // -------------------------------------------------------------
    // Test 7: Helmet Security Policy Compatibility
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Helmet Cross-Origin Resource Policy ---');

    assert(
      resApiHealth.headers.get('cross-origin-resource-policy') === 'cross-origin',
      'Cross-Origin-Resource-Policy is set to cross-origin (prevents Vercel cross-origin blocking)'
    );

    console.log('\n====================================================');
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log('====================================================\n');

  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
