import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import app from '../app.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { generateToken } from './jwt.js';

const runProjectTests = async () => {
  console.log('====================================================');
  console.log('🧪 ProjectPulse AI - Project CRUD & Security Tests');
  console.log('====================================================');

  let serverInstance = null;
  let baseUrl = '';
  const tracker = {
    userIds: [],
    projectIds: [],
    requirementIds: [],
    reportIds: [],
  };

  let allPassed = true;

  try {
    // 1. Connect DB
    console.log('\n[Setup] Connecting to MongoDB Atlas...');
    await connectDB(process.env.MONGODB_URI);
    console.log('  ✅ Database connected.');

    // 2. Start Ephemeral Server
    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, '127.0.0.1', resolve));
    const port = serverInstance.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/projects`;
    console.log(`  ✅ Test server running on port ${port}`);

    // 3. Create Two Test Users to verify Multi-Tenant Isolation
    const userA = await User.create({
      name: 'User A (Owner)',
      email: `user.a.${Date.now()}@projectpulse.ai`,
      password: 'Password123!',
      role: 'user',
    });
    tracker.userIds.push(userA._id);
    const tokenA = generateToken({ id: userA._id, role: userA.role });

    const userB = await User.create({
      name: 'User B (Attacker/Separate)',
      email: `user.b.${Date.now()}@projectpulse.ai`,
      password: 'Password123!',
      role: 'user',
    });
    tracker.userIds.push(userB._id);
    const tokenB = generateToken({ id: userB._id, role: userB.role });

    console.log('  ✅ Created User A and User B with active JWT tokens.');

    // Helper request wrapper
    const makeRequest = async (path, options = {}, token = null) => {
      const headers = {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-runner',
        ...(options.headers || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      });
      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    let projectA1Id = null;
    let projectA2Id = null;
    let projectBId = null;

    // Test 1: Create project with valid JWT
    console.log('\n1. Testing Create Project with valid JWT (POST /api/projects)...');
    const createRes = await makeRequest(
      '',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Campus Task Manager AI',
          description: 'Automated student task scheduler and grader',
          category: 'Web Application',
          technologies: ['React', 'Express', 'MongoDB'],
          targetMilestoneDate: '2026-12-31',
        }),
      },
      tokenA
    );

    if (
      createRes.status === 201 &&
      createRes.data?.success &&
      createRes.data?.data?.project?.name === 'Campus Task Manager AI' &&
      createRes.data?.data?.project?.status === 'draft'
    ) {
      projectA1Id = createRes.data.data.project.id || createRes.data.data.project._id;
      tracker.projectIds.push(projectA1Id);
      console.log(`  ✅ Project created: ID=${projectA1Id}, status="draft", owner=User A`);
    } else {
      console.error('  ❌ Test 1 failed:', createRes);
      allPassed = false;
    }

    // Test 2: Reject project creation without JWT
    console.log('\n2. Testing Reject project creation without JWT...');
    const noAuthRes = await makeRequest(
      '',
      {
        method: 'POST',
        body: JSON.stringify({ name: 'Unauthorized Project' }),
      },
      null // No token
    );

    if (noAuthRes.status === 401 && noAuthRes.data?.success === false) {
      console.log('  ✅ Rejected unauthenticated project creation with 401.');
    } else {
      console.error('  ❌ Test 2 failed:', noAuthRes);
      allPassed = false;
    }

    // Test 3: Reject invalid project data
    console.log('\n3. Testing Reject invalid project data (missing name)...');
    const invalidDataRes = await makeRequest(
      '',
      {
        method: 'POST',
        body: JSON.stringify({ description: 'No name given' }),
      },
      tokenA
    );

    if (invalidDataRes.status === 400 && invalidDataRes.data?.success === false) {
      console.log('  ✅ Rejected missing name with 400 Bad Request.');
    } else {
      console.error('  ❌ Test 3 failed:', invalidDataRes);
      allPassed = false;
    }

    // Setup User B project and User A second project
    const createBRes = await makeRequest(
      '',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'User B Confidential Project',
          category: 'Mobile Application',
        }),
      },
      tokenB
    );
    projectBId = createBRes.data.data.project.id || createBRes.data.data.project._id;
    tracker.projectIds.push(projectBId);

    const createA2Res = await makeRequest(
      '',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Mobile Inventory Scanner',
          category: 'Mobile Application',
          technologies: 'React Native, Node.js',
        }),
      },
      tokenA
    );
    projectA2Id = createA2Res.data.data.project.id || createA2Res.data.data.project._id;
    tracker.projectIds.push(projectA2Id);

    // Test 4: Get only the authenticated user's projects
    console.log('\n4. Testing Multi-Tenant Data Isolation (GET /api/projects)...');
    const listARes = await makeRequest('', { method: 'GET' }, tokenA);

    const aProjectNames = listARes.data?.data?.projects?.map((p) => p.name) || [];
    if (
      listARes.status === 200 &&
      aProjectNames.includes('Campus Task Manager AI') &&
      aProjectNames.includes('Mobile Inventory Scanner') &&
      !aProjectNames.includes('User B Confidential Project')
    ) {
      console.log('  ✅ User A only receives their projects. User B project is isolated.');
    } else {
      console.error('  ❌ Multi-tenant isolation failed:', listARes.data);
      allPassed = false;
    }

    // Test 5: Search projects
    console.log('\n5. Testing Search projects by name (GET /api/projects?search=Inventory)...');
    const searchRes = await makeRequest('?search=Inventory', { method: 'GET' }, tokenA);
    const searchMatches = searchRes.data?.data?.projects || [];

    if (
      searchRes.status === 200 &&
      searchMatches.length === 1 &&
      searchMatches[0].name === 'Mobile Inventory Scanner'
    ) {
      console.log('  ✅ Search returned exact match: "Mobile Inventory Scanner".');
    } else {
      console.error('  ❌ Search test failed:', searchRes.data);
      allPassed = false;
    }

    // Test 6: Filter by status and category
    console.log('\n6. Testing Filter by category & status (GET /api/projects?category=Web Application)...');
    const filterRes = await makeRequest('?category=Web%20Application&status=draft', { method: 'GET' }, tokenA);
    const filterMatches = filterRes.data?.data?.projects || [];

    if (
      filterRes.status === 200 &&
      filterMatches.length === 1 &&
      filterMatches[0].name === 'Campus Task Manager AI'
    ) {
      console.log('  ✅ Category and status filter returned 1 matching project.');
    } else {
      console.error('  ❌ Filter test failed:', filterRes.data);
      allPassed = false;
    }

    // Test 7: Pagination
    console.log('\n7. Testing Pagination (GET /api/projects?page=1&limit=1)...');
    const pageRes = await makeRequest('?page=1&limit=1', { method: 'GET' }, tokenA);
    const pag = pageRes.data?.data?.pagination;

    if (
      pageRes.status === 200 &&
      pageRes.data?.data?.projects?.length === 1 &&
      pag?.total === 2 &&
      pag?.page === 1 &&
      pag?.limit === 1 &&
      pag?.totalPages === 2
    ) {
      console.log(`  ✅ Pagination verified: page=${pag.page}, limit=${pag.limit}, total=${pag.total}, totalPages=${pag.totalPages}.`);
    } else {
      console.error('  ❌ Pagination test failed:', pageRes.data);
      allPassed = false;
    }

    // Test 8: Retrieve a single owned project with its requirements
    console.log('\n8. Testing Retrieve single owned project (GET /api/projects/:id)...');
    // Add a requirement and report under projectA1 to verify population
    const sampleReq = await Requirement.create({
      project: projectA1Id,
      requirementCode: 'REQ-TASK-01',
      title: 'Real-time WebSocket notifications',
      weight: 5,
    });
    tracker.requirementIds.push(sampleReq._id);

    const sampleReport = await AnalysisReport.create({
      project: projectA1Id,
      status: 'pending',
      totalRequirements: 1,
    });
    tracker.reportIds.push(sampleReport._id);

    await Project.findByIdAndUpdate(projectA1Id, { latestReport: sampleReport._id });

    const getSingleRes = await makeRequest(`/${projectA1Id}`, { method: 'GET' }, tokenA);
    const pData = getSingleRes.data?.data?.project;

    if (
      getSingleRes.status === 200 &&
      pData?.name === 'Campus Task Manager AI' &&
      Array.isArray(pData?.requirements) &&
      pData?.requirements.length === 1 &&
      pData?.requirements[0].requirementCode === 'REQ-TASK-01' &&
      pData?.latestReport?.status === 'pending'
    ) {
      console.log('  ✅ Single project returned with populated latestReport and requirements array.');
    } else {
      console.error('  ❌ Single project retrieval failed:', getSingleRes.data);
      allPassed = false;
    }

    // Test 9: Reject access to another user's project (IDOR protection)
    console.log("\n9. Testing IDOR Protection: Reject access to another user's project...");
    const idorRes = await makeRequest(`/${projectBId}`, { method: 'GET' }, tokenA);

    if (idorRes.status === 404 && idorRes.data?.message === 'Project not found') {
      console.log('  ✅ User A access to User B project returned 404 (ownership strictly protected).');
    } else {
      console.error('  ❌ IDOR protection failed:', idorRes);
      allPassed = false;
    }

    // Test 10: Update owned project
    console.log('\n10. Testing Update owned project (PUT /api/projects/:id)...');
    const updateRes = await makeRequest(
      `/${projectA1Id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Campus Task Manager AI (Updated)',
          description: 'Updated description for milestone v2',
        }),
      },
      tokenA
    );

    if (
      updateRes.status === 200 &&
      updateRes.data?.data?.project?.name === 'Campus Task Manager AI (Updated)'
    ) {
      console.log('  ✅ Project updated successfully by owner.');
    } else {
      console.error('  ❌ Project update failed:', updateRes);
      allPassed = false;
    }

    // Test 11: Reject unauthorized updates
    console.log("\n11. Testing Reject unauthorized project update...");
    const unauthorizedUpdateRes = await makeRequest(
      `/${projectA1Id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name: 'Tampered By User B' }),
      },
      tokenB // User B attempts to update User A project
    );

    if (unauthorizedUpdateRes.status === 404) {
      console.log('  ✅ Unauthorized update rejected with 404.');
    } else {
      console.error('  ❌ Unauthorized update test failed:', unauthorizedUpdateRes);
      allPassed = false;
    }

    // Test 12: Prevent owner ID modification
    console.log('\n12. Testing Mass-Assignment Prevention: Attempt changing owner ID...');
    await makeRequest(
      `/${projectA1Id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          owner: userB._id.toString(), // Attacker attempts to transfer ownership
          name: 'Attempted Hijack',
        }),
      },
      tokenA
    );

    const verifiedProject = await Project.findById(projectA1Id);
    if (verifiedProject.owner.toString() === userA._id.toString()) {
      console.log('  ✅ Owner ID cannot be overwritten by PUT request (owner integrity maintained).');
    } else {
      console.error('  ❌ Security Failure: Project owner was modified via request body!');
      allPassed = false;
    }

    // Test 13: Delete owned project and associated records
    console.log('\n13. Testing Cascade Delete of owned project and associated records...');
    const deleteRes = await makeRequest(`/${projectA1Id}`, { method: 'DELETE' }, tokenA);

    const checkProject = await Project.findById(projectA1Id);
    const checkReq = await Requirement.find({ project: projectA1Id });
    const checkReport = await AnalysisReport.find({ project: projectA1Id });

    if (
      deleteRes.status === 200 &&
      !checkProject &&
      checkReq.length === 0 &&
      checkReport.length === 0
    ) {
      console.log('  ✅ Project, requirements, and reports were cascade-deleted cleanly.');
    } else {
      console.error('  ❌ Cascade delete failed:', { checkProject, checkReq, checkReport });
      allPassed = false;
    }

    // Test 14: Reject unauthorized deletion
    console.log('\n14. Testing Reject unauthorized deletion...');
    const unauthDeleteRes = await makeRequest(
      `/${projectBId}`,
      { method: 'DELETE' },
      tokenA // User A attempts to delete User B project
    );

    const userBProjectStillExists = await Project.findById(projectBId);

    if (unauthDeleteRes.status === 404 && userBProjectStillExists) {
      console.log('  ✅ Unauthorized deletion rejected with 404; User B project unharmed.');
    } else {
      console.error('  ❌ Unauthorized deletion test failed:', unauthDeleteRes);
      allPassed = false;
    }

    // Test 15: Reject malformed MongoDB ObjectIds
    console.log('\n15. Testing Reject malformed MongoDB ObjectIds...');
    const malformedGetRes = await makeRequest('/invalid-id-xyz', { method: 'GET' }, tokenA);
    const malformedPutRes = await makeRequest('/123-bad-id', { method: 'PUT', body: JSON.stringify({ name: 'X' }) }, tokenA);
    const malformedDelRes = await makeRequest('/not-an-id', { method: 'DELETE' }, tokenA);

    if (
      malformedGetRes.status === 400 &&
      malformedPutRes.status === 400 &&
      malformedDelRes.status === 400
    ) {
      console.log('  ✅ Malformed MongoDB ObjectIds correctly rejected with status 400.');
    } else {
      console.error('  ❌ Malformed ObjectId test failed:', {
        malformedGetRes,
        malformedPutRes,
        malformedDelRes,
      });
      allPassed = false;
    }

    // Cleanup Remaining Test Records
    console.log('\n[Teardown] Cleaning up test records from MongoDB Atlas...');
    if (tracker.projectIds.length > 0) {
      await Project.deleteMany({ _id: { $in: tracker.projectIds } });
    }
    if (tracker.requirementIds.length > 0) {
      await Requirement.deleteMany({ _id: { $in: tracker.requirementIds } });
    }
    if (tracker.reportIds.length > 0) {
      await AnalysisReport.deleteMany({ _id: { $in: tracker.reportIds } });
    }
    if (tracker.userIds.length > 0) {
      await User.deleteMany({ _id: { $in: tracker.userIds } });
    }
    console.log('  ✅ All isolated test records safely removed.');

  } catch (err) {
    console.error('\n💥 Unexpected error during project test suite:', err);
    allPassed = false;

    // Emergency cleanup
    try {
      if (tracker.projectIds.length > 0) await Project.deleteMany({ _id: { $in: tracker.projectIds } });
      if (tracker.requirementIds.length > 0) await Requirement.deleteMany({ _id: { $in: tracker.requirementIds } });
      if (tracker.reportIds.length > 0) await AnalysisReport.deleteMany({ _id: { $in: tracker.reportIds } });
      if (tracker.userIds.length > 0) await User.deleteMany({ _id: { $in: tracker.userIds } });
    } catch (cErr) {
      console.error('Cleanup error:', cErr.message);
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
    console.log('🎉 ALL 15 PROJECT CRUD & SECURITY TESTS PASSED! 🎉');
    console.log('====================================================\n');
  } else {
    console.error('❌ SOME PROJECT CRUD TESTS FAILED. See log details above.');
    console.log('====================================================\n');
    process.exitCode = 1;
  }
};

runProjectTests();
