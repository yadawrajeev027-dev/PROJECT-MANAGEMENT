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
import { generateToken } from './jwt.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 ProjectPulse AI - Project Specification & Retrieval Flow');
  console.log('====================================================\n');

  let serverInstance = null;
  const cleanup = {
    userIds: [],
    projectIds: [],
    reqIds: [],
  };

  try {
    await connectDB(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, '127.0.0.1', resolve));
    const port = serverInstance.address().port;
    const baseApi = `http://127.0.0.1:${port}/api`;
    console.log(`✅ Test server running on port ${port}\n`);

    // 1. Setup Test Users
    const ownerUser = await User.create({
      name: 'Owner Flow User',
      email: `owner.flow.${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'user',
    });
    cleanup.userIds.push(ownerUser._id);
    const ownerToken = generateToken({ id: ownerUser._id, role: ownerUser.role });

    const otherUser = await User.create({
      name: 'Other Flow User',
      email: `other.flow.${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'user',
    });
    cleanup.userIds.push(otherUser._id);
    const otherToken = generateToken({ id: otherUser._id, role: otherUser.role });

    // Test 1: Project Creation returns valid MongoDB ObjectId
    console.log('--- Test 1: Create Project & ObjectId Validation ---');
    const createRes = await fetch(`${baseApi}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: 'Store Verification Project',
        description: 'Testing specification retrieval and requirement matrix',
        category: 'Web Application',
        technologies: ['React', 'Node.js', 'Express'],
      }),
    });
    const createBody = await createRes.json();
    assert(createRes.status === 201, 'POST /api/projects returned HTTP 201 Created');
    assert(createBody.success === true, 'Response contains success: true');
    const createdProject = createBody.data?.project;
    assert(Boolean(createdProject && createdProject._id), 'Response contains data.project with _id');
    const projectId = createdProject._id;
    cleanup.projectIds.push(projectId);
    assert(/^[0-9a-fA-F]{24}$/.test(projectId), `Project ID is valid 24-character hex ObjectId (${projectId})`);

    // Test 2: Add Requirements to Project
    console.log('\n--- Test 2: Add Requirement with Code and Weight ---');
    const reqRes = await fetch(`${baseApi}/projects/${projectId}/requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        code: 'REQ-001',
        title: 'Authentication Middleware',
        description: 'Verify JWT auth tokens on API routes',
        priority: 'high',
        weight: 15,
      }),
    });
    const reqBody = await reqRes.json();
    assert(reqRes.status === 201, 'POST /api/projects/:id/requirements returned HTTP 201');
    assert(reqBody.success === true, 'Requirement added successfully');
    const reqRecord = reqBody.data?.requirement || reqBody.data;
    if (reqRecord?._id) cleanup.reqIds.push(reqRecord._id);

    // Test 3: GET /api/projects/:id by Owner
    console.log('\n--- Test 3: Retrieve Project by ID (Owner) ---');
    const getRes = await fetch(`${baseApi}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    const getBody = await getRes.json();
    assert(getRes.status === 200, 'GET /api/projects/:id returned HTTP 200 OK');
    assert(getBody.success === true, 'Response has success: true');
    assert(Boolean(getBody.data?.project), 'Response wraps project in data.project');
    const fetchedProj = getBody.data?.project;
    assert(fetchedProj._id === projectId, 'Fetched project ID matches created ID');
    assert(fetchedProj.name === 'Store Verification Project', 'Project name is intact');
    assert(Array.isArray(fetchedProj.requirements) && fetchedProj.requirements.length === 1, 'Project includes linked requirements');
    assert(fetchedProj.requirements[0].requirementCode === 'REQ-001' || fetchedProj.requirements[0].code === 'REQ-001', 'Requirement code REQ-001 is preserved');

    // Test 4: Frontend Response Unwrapping Simulation
    console.log('\n--- Test 4: Frontend Response Unwrapping Simulation ---');
    // Simulate what projectService.getProject and ProjectDetails do:
    const axiosSimulatedData = getBody; // Axios interceptor returns response.data
    const unwrappedProj = axiosSimulatedData?.data?.project || axiosSimulatedData?.project || axiosSimulatedData?.data || axiosSimulatedData;
    assert(Boolean(unwrappedProj && unwrappedProj._id), 'Frontend helper extracts project safely without TypeError');
    assert(unwrappedProj._id.toString() === projectId, 'unwrappedProj._id.toString() executes without error');

    // Test 5: IDOR Protection (Different User cannot access)
    console.log('\n--- Test 5: Multi-Tenant IDOR Guard ---');
    const attackerRes = await fetch(`${baseApi}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${otherToken}`,
      },
    });
    assert(attackerRes.status === 404, 'Unauthorized tenant receives HTTP 404 Not Found');

    // Test 6: GET /api/projects List includes projects
    console.log('\n--- Test 6: Project List API ---');
    const listRes = await fetch(`${baseApi}/projects`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
      },
    });
    const listBody = await listRes.json();
    assert(listRes.status === 200, 'GET /api/projects returned HTTP 200 OK');
    const projectsArray = listBody.data?.projects;
    assert(Array.isArray(projectsArray) && projectsArray.length >= 1, 'Projects list contains array under data.projects');

    // Test 7: Target Project 6aecd1b8b4dd6e54c217b0da in MongoDB
    console.log('\n--- Test 7: Verify Existing Project 6aecd1b8b4dd6e54c217b0da ---');
    const targetProject = await Project.findById('6aecd1b8b4dd6e54c217b0da');
    assert(Boolean(targetProject), 'Target project 6aecd1b8b4dd6e54c217b0da exists in MongoDB');
    if (targetProject) {
      assert(targetProject.name === 'Store', `Target project name is "${targetProject.name}"`);
      assert(targetProject.owner.toString() === '6aecb97fa5ab6741dc38f456', 'Target project owner matches Prayash singh');
      
      const prayashToken = generateToken({ id: '6aecb97fa5ab6741dc38f456', role: 'user' });
      const targetFetchRes = await fetch(`${baseApi}/projects/6aecd1b8b4dd6e54c217b0da`, {
        headers: {
          'Authorization': `Bearer ${prayashToken}`,
        },
      });
      assert(targetFetchRes.status === 200, 'GET /api/projects/6aecd1b8b4dd6e54c217b0da returns HTTP 200 with user token');
      const targetFetchBody = await targetFetchRes.json();
      assert(targetFetchBody.data?.project?._id === '6aecd1b8b4dd6e54c217b0da', 'Returns actual saved data for target project');
      assert(targetFetchBody.data?.project?.name === 'Store', 'Returns correct project name "Store"');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Cleanup temporary test items (never touch 6aecd1b8b4dd6e54c217b0da)
    try {
      if (cleanup.reqIds.length > 0) {
        await Requirement.deleteMany({ _id: { $in: cleanup.reqIds } });
      }
      if (cleanup.projectIds.length > 0) {
        await Project.deleteMany({ _id: { $in: cleanup.projectIds } });
      }
      if (cleanup.userIds.length > 0) {
        await User.deleteMany({ _id: { $in: cleanup.userIds } });
      }
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await disconnectDB();

    console.log('\n====================================================');
    console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
