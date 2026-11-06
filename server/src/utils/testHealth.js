import http from 'http';
import app from '../app.js';

const testHealthEndpoint = async () => {
  console.log('================================================');
  console.log('🧪 Testing Health Check API & Express Foundation');
  console.log('================================================');

  // Spin up an ephemeral HTTP server for testing
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`📡 Test server listening on ephemeral port: ${port}`);

  let passed = true;

  // 1. Test GET /api/health
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    const data = await res.json();

    console.log('\n1. Testing GET /api/health:');
    console.log(`   HTTP Status: ${res.status}`);
    console.log(`   Response Body:`, JSON.stringify(data, null, 2));

    if (res.status !== 200) {
      console.error(`❌ Expected status 200, got ${res.status}`);
      passed = false;
    }
    if (data.success !== true) {
      console.error(`❌ Expected data.success to be true`);
      passed = false;
    }
    if (data.message !== 'Backend is running') {
      console.error(`❌ Expected data.message to be 'Backend is running', got '${data.message}'`);
      passed = false;
    }
    if (!data.timestamp) {
      console.error(`❌ Expected data.timestamp to be defined`);
      passed = false;
    }
    if (passed) {
      console.log('✅ GET /api/health PASSED with expected payload!');
    }
  } catch (err) {
    console.error('❌ GET /api/health failed with error:', err.message);
    passed = false;
  }

  // 2. Test 404 Not Found Handling
  try {
    const res404 = await fetch(`http://127.0.0.1:${port}/api/unmapped-route`);
    const data404 = await res404.json();

    console.log('\n2. Testing 404 Not Found Middleware:');
    console.log(`   HTTP Status: ${res404.status}`);
    console.log(`   Response Body:`, JSON.stringify(data404, null, 2));

    if (res404.status === 404 && data404.success === false) {
      console.log('✅ 404 Not Found handler PASSED!');
    } else {
      console.error('❌ 404 handler failed to return status 404');
      passed = false;
    }
  } catch (err) {
    console.error('❌ 404 test failed with error:', err.message);
    passed = false;
  }

  // 3. Test Security Headers (Helmet)
  try {
    const resHeaders = await fetch(`http://127.0.0.1:${port}/api/health`);
    const hasHelmetHeaders = resHeaders.headers.has('x-content-type-options');
    console.log('\n3. Testing Security Headers (Helmet):');
    console.log(`   X-Content-Type-Options: ${resHeaders.headers.get('x-content-type-options')}`);

    if (hasHelmetHeaders) {
      console.log('✅ Helmet middleware PASSED!');
    } else {
      console.error('❌ Helmet headers not found');
      passed = false;
    }
  } catch (err) {
    console.error('❌ Helmet header test failed:', err.message);
    passed = false;
  }

  // Clean shutdown of test server
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
  console.log('\n🔒 Ephemeral test server closed.');

  if (passed) {
    console.log('\n>>> ALL BACKEND FOUNDATION TESTS PASSED! <<<\n');
  } else {
    console.error('\n>>> SOME TESTS FAILED <<<\n');
    process.exitCode = 1;
  }
};

testHealthEndpoint().catch((err) => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
