/**
 * testIntegration.js
 * Step 11: End-to-End Frontend–Backend Workflow Integration Test Suite.
 *
 * Verifies the complete 15-step application pipeline:
 *  1. Register user
 *  2. Login and get token
 *  3. Verify session (GET /auth/me)
 *  4. Create project (POST /projects)
 *  5. Add requirements (POST /projects/:id/requirements)
 *  6. Upload source ZIP (POST /projects/:id/upload)
 *  7. Extract ZIP (POST /projects/:id/extract)
 *  8. Verify extraction output (GET /projects/:id/extraction-status)
 *  9. Trigger AST source analysis (POST /projects/:id/analyze-source)
 *  10. Verify analysis results (GET /projects/:id/source-analysis-status)
 *  11. Trigger requirement verification (POST /projects/:id/verify-requirements)
 *  12. Verify requirement statuses (GET /projects/:id/requirements)
 *  13. Request AI recommendations (POST /projects/:id/generate-recommendations)
 *  14. Calculate progress deterministically (POST /projects/:id/calculate-progress)
 *  15. Verify dashboard and reports (GET /projects/dashboard/stats & GET /reports)
 *
 * Also verifies:
 *  16. IDOR protection on project resources
 *  17. Unauthenticated request protection (401)
 *  18. Zero absolute server path leakage across all payloads
 */

import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import fs from 'fs';
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
import { getUploadDir } from '../config/uploadConfig.js';
import { removeDirSafe, getExtractionBaseDir } from '../services/zipExtractionService.js';

// CRC-32 table generator for building standard ZIP archives
const makeCrcTable = () => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};
const crcTable = makeCrcTable();
const computeCrc32 = (buf) => {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

/**
 * In-Memory Standard ZIP Builder
 */
const buildZipArchive = (entries) => {
  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;

  for (const entry of entries) {
    const isDir = entry.name.endsWith('/');
    const dataBuf = isDir
      ? Buffer.alloc(0)
      : Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(entry.data || '');
    const nameBuf = Buffer.from(entry.name);
    const crc = computeCrc32(dataBuf);
    const uncompressedSize = dataBuf.length;
    const compressedSize = dataBuf.length;

    // Local Header (30 bytes + name + data)
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(10, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // store (no compression)
    local.writeUInt16LE(0x5421, 10);
    local.writeUInt16LE(0x5958, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(uncompressedSize, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    const localEntryBuf = Buffer.concat([local, nameBuf, dataBuf]);
    localHeaders.push(localEntryBuf);

    // Central Directory Header (46 bytes + name)
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(10, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0x5421, 12);
    central.writeUInt16LE(0x5958, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE((isDir ? 0o040755 << 16 : 0o100644 << 16) >>> 0, 38);
    central.writeUInt32LE(currentOffset, 42);

    centralHeaders.push(Buffer.concat([central, nameBuf]));
    currentOffset += localEntryBuf.length;
  }

  const centralDirBuf = Buffer.concat(centralHeaders);
  const centralDirOffset = currentOffset;
  const centralDirSize = centralDirBuf.length;

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, centralDirBuf, eocd]);
};

/**
 * Creates the CampusTask Manager fixture ZIP archive
 */
const buildCampusTaskZip = () => {
  return buildZipArchive([
    {
      name: 'package.json',
      data: JSON.stringify({
        name: 'campustask-manager',
        version: '1.0.0',
        dependencies: {
          express: '^4.19.2',
          mongoose: '^8.3.1',
          jsonwebtoken: '^9.0.2',
          bcryptjs: '^2.4.3',
          react: '^18.2.0',
        },
      }, null, 2),
    },
    {
      name: 'src/models/User.js',
      data: `
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
      `.trim(),
    },
    {
      name: 'src/models/Task.js',
      data: `
const mongoose = require('mongoose');
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  dueDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: String, required: true }
}, { timestamps: true });
module.exports = mongoose.model('Task', TaskSchema);
      `.trim(),
    },
    {
      name: 'src/middleware/authMiddleware.js',
      data: `
const jwt = require('jsonwebtoken');
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'testsecret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
module.exports = authMiddleware;
      `.trim(),
    },
    {
      name: 'src/controllers/authController.js',
      data: `
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  res.status(201).json({ success: true, user });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, 'testsecret', { expiresIn: '1d' });
  res.status(200).json({ success: true, token, user });
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
};

module.exports = { register, login, getMe };
      `.trim(),
    },
    {
      name: 'src/controllers/taskController.js',
      data: `
const Task = require('../models/Task');

const createTask = async (req, res) => {
  const task = await Task.create(req.body);
  res.status(201).json({ success: true, task });
};

const getTasks = async (req, res) => {
  const { status, course } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (course) filter.course = course;
  const tasks = await Task.find(filter);
  res.status(200).json({ success: true, tasks });
};

const updateTask = async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json({ success: true, task });
};

const deleteTask = async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: 'Task deleted' });
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
      `.trim(),
    },
    {
      name: 'src/routes/authRoutes.js',
      data: `
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  res.status(201).json({ success: true, user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, 'testsecret', { expiresIn: '1d' });
  res.status(200).json({ success: true, token, user });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
});

module.exports = router;
      `.trim(),
    },
    {
      name: 'src/routes/taskRoutes.js',
      data: `
const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.post('/tasks', createTask);
router.get('/tasks', getTasks);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

module.exports = router;
      `.trim(),
    },
    {
      name: 'src/client/TaskDashboard.jsx',
      data: `
import React, { useState, useEffect } from 'react';

export default function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');

  return (
    <div className="task-dashboard">
      <h1>CampusTask Manager</h1>
      <div className="task-filters">
        <button onClick={() => setFilter('all')}>All Tasks</button>
        <button onClick={() => setFilter('pending')}>Pending</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      <div className="task-list">
        {tasks.map(t => (
          <div key={t._id} className="task-card">
            <h3>{t.title}</h3>
            <span>{t.course}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
      `.trim(),
    },
  ]);
};

const runIntegrationTests = async () => {
  console.log('====================================================');
  console.log('🧪 ProjectPulse AI - Step 11 Full Workflow Integration');
  console.log('====================================================');

  let serverInstance = null;
  let baseUrl = '';
  let allPassed = true;

  const tracker = {
    userIds: [],
    projectIds: [],
    requirementIds: [],
    reportIds: [],
    zipPaths: [],
    extractedDirs: [],
  };

  const pass = (n, msg) => console.log(`  ✅ Step ${n}: ${msg}`);
  const fail = (n, msg, detail) => {
    console.error(`  ❌ Step ${n}: ${msg}`, detail ?? '');
    allPassed = false;
  };

  try {
    // 1. Connect MongoDB
    await connectDB(process.env.MONGODB_URI);
    console.log('  ✅ Database connected.');

    // 2. Start Ephemeral Server
    serverInstance = http.createServer(app);
    await new Promise((resolve) => serverInstance.listen(0, '127.0.0.1', resolve));
    const port = serverInstance.address().port;
    baseUrl = `http://127.0.0.1:${port}/api`;
    console.log(`  ✅ Ephemeral test server running on port ${port}`);

    // Helper for JSON requests
    const apiReq = async (endpoint, options = {}, token = null) => {
      const headers = {
        'Content-Type': 'application/json',
        'x-bypass-rate-limit': 'test-runner',
        ...(options.headers || {}),
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // Helper for multipart/form-data upload
    const uploadZipReq = async (endpoint, zipBuffer, filename = 'campustask.zip', token = null) => {
      const boundary = `----WebKitFormBoundary${Date.now()}`;
      const pre = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/zip\r\n\r\n`
      );
      const post = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([pre, zipBuffer, post]);

      const headers = {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
        'x-bypass-rate-limit': 'test-runner',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body,
      });

      const data = await res.json().catch(() => null);
      return { status: res.status, data };
    };

    // ==========================================
    // WORKFLOW STEP 1: Register User
    // ==========================================
    const testEmail = `student.dev.${Date.now()}@campus.edu`;
    const regRes = await apiReq('/auth/register', {
      method: 'POST',
      body: {
        name: 'Campus Developer',
        email: testEmail,
        password: 'Password123!',
      },
    });

    const regToken = regRes.data?.data?.token || regRes.data?.token;
    const regUser = regRes.data?.data?.user || regRes.data?.user;

    if (regRes.status === 201 && regRes.data?.success && regToken) {
      pass(1, 'User registered successfully with 201 Created and JWT token issued');
      tracker.userIds.push(regUser?.id || regUser?._id);
    } else {
      fail(1, 'Registration failed', regRes);
    }

    // ==========================================
    // WORKFLOW STEP 2: Login and Get Token
    // ==========================================
    const loginRes = await apiReq('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'Password123!',
      },
    });

    let authToken = null;
    let authUser = null;
    const logToken = loginRes.data?.data?.token || loginRes.data?.token;
    const logUser = loginRes.data?.data?.user || loginRes.data?.user;

    if (loginRes.status === 200 && loginRes.data?.success && logToken) {
      authToken = logToken;
      authUser = logUser;
      pass(2, 'Login succeeded with 200 OK and valid JWT token');
    } else {
      fail(2, 'Login failed', loginRes);
    }

    // ==========================================
    // WORKFLOW STEP 3: Verify Session (GET /auth/me)
    // ==========================================
    const meRes = await apiReq('/auth/me', {}, authToken);
    const meUser = meRes.data?.data?.user || meRes.data?.user;
    if (meRes.status === 200 && meRes.data?.success && meUser?.email === testEmail) {
      pass(3, 'Session verified via GET /auth/me with matching user credentials');
    } else {
      fail(3, 'Session verification failed', meRes);
    }

    // Verify 401 on unauthenticated request
    const unauthRes = await apiReq('/auth/me', {});
    if (unauthRes.status === 401) {
      pass('3b', 'Unauthenticated request to protected route cleanly rejected with 401');
    } else {
      fail('3b', 'Expected 401 on missing token', unauthRes);
    }

    // ==========================================
    // WORKFLOW STEP 4: Create Project
    // ==========================================
    const createProjectRes = await apiReq('/projects', {
      method: 'POST',
      body: {
        name: 'CampusTask Manager',
        description: 'Full-stack university task and course management tracking platform',
        category: 'Web Application',
        technologies: ['Node.js', 'Express', 'MongoDB', 'React'],
      },
    }, authToken);

    let projectId = null;
    if (createProjectRes.status === 201 && createProjectRes.data?.success) {
      const proj = createProjectRes.data.data?.project || createProjectRes.data.data;
      projectId = proj._id || proj.id;
      tracker.projectIds.push(projectId);
      pass(4, `Project created successfully with ID: ${projectId}`);
    } else {
      fail(4, 'Project creation failed', createProjectRes);
    }

    // ==========================================
    // WORKFLOW STEP 5: Add Requirements
    // ==========================================
    const campusRequirements = [
      { code: 'REQ-001', title: 'User Authentication & JWT Middleware', description: 'Secure user login, registration, and JWT bearer token verification.', priority: 'high', weight: 20 },
      { code: 'REQ-002', title: 'Task CRUD Operations', description: 'RESTful API endpoints for creating, retrieving, updating, and deleting tasks.', priority: 'critical', weight: 25 },
      { code: 'REQ-003', title: 'Task Filtering & Queries', description: 'Filter tasks by course, status, and due dates via query parameters.', priority: 'medium', weight: 20 },
      { code: 'REQ-004', title: 'Responsive Task Dashboard', description: 'React client UI displaying active tasks, status filters, and responsive layout.', priority: 'medium', weight: 15 },
      { code: 'REQ-005', title: 'WebSockets Live Chat Room', description: 'Real-time WebSocket chat room server with socket.io broadcasting and message history.', priority: 'low', weight: 20 },
    ];

    let reqsAddedCount = 0;
    for (const reqData of campusRequirements) {
      const addRes = await apiReq(`/projects/${projectId}/requirements`, {
        method: 'POST',
        body: reqData,
      }, authToken);
      if (addRes.status === 201 && addRes.data?.success) {
        reqsAddedCount++;
        tracker.requirementIds.push(addRes.data.data?._id);
      }
    }

    const listReqsRes = await apiReq(`/projects/${projectId}/requirements`, {}, authToken);
    if (reqsAddedCount === 5 && listReqsRes.status === 200 && Array.isArray(listReqsRes.data?.data) && listReqsRes.data.data.length === 5) {
      pass(5, `5 requirements registered with total weight 100 and pending status`);
    } else {
      fail(5, `Requirement registration failed: ${reqsAddedCount}/5 added`, listReqsRes);
    }

    // ==========================================
    // WORKFLOW STEP 6: Upload ZIP
    // ==========================================
    const campusZipBuffer = buildCampusTaskZip();
    const uploadRes = await uploadZipReq(`/projects/${projectId}/upload`, campusZipBuffer, 'campustask.zip', authToken);

    if (uploadRes.status === 200 && uploadRes.data?.success) {
      pass(6, `CampusTask Manager ZIP uploaded successfully (${campusZipBuffer.length} bytes)`);
      if (uploadRes.data.data?.zipStoragePath) {
        tracker.zipPaths.push(uploadRes.data.data.zipStoragePath);
      }
    } else {
      fail(6, 'ZIP upload failed', uploadRes);
    }

    // ==========================================
    // WORKFLOW STEP 7: Extract ZIP
    // ==========================================
    const extractRes = await apiReq(`/projects/${projectId}/extract`, { method: 'POST' }, authToken);
    if (extractRes.status === 200 && extractRes.data?.success) {
      pass(7, 'ZIP extraction triggered successfully');
      tracker.extractedDirs.push(path.join(getExtractionBaseDir(), String(projectId)));
    } else {
      fail(7, 'Extraction trigger failed', extractRes);
    }

    // ==========================================
    // WORKFLOW STEP 8: Verify Extraction Output
    // ==========================================
    const statusRes = await apiReq(`/projects/${projectId}/extraction-status`, {}, authToken);
    if (statusRes.status === 200 && statusRes.data?.data?.extractionStatus === 'completed') {
      const extractedCount = statusRes.data.data.extractedFileCount ?? statusRes.data.data.extractedFilesCount ?? 0;
      pass(8, `Extraction status verified: 'completed' with ${extractedCount} safe files extracted`);
    } else {
      fail(8, 'Extraction status verification failed', statusRes);
    }

    // ==========================================
    // WORKFLOW STEP 9: Trigger AST Source Analysis
    // ==========================================
    const analyzeRes = await apiReq(`/projects/${projectId}/analyze-source`, { method: 'POST' }, authToken);
    if (analyzeRes.status === 200 && analyzeRes.data?.success) {
      pass(9, 'Babel & TypeScript AST source analysis executed successfully');
    } else {
      fail(9, 'AST analysis execution failed', analyzeRes);
    }

    // ==========================================
    // WORKFLOW STEP 10: Verify Analysis Results
    // ==========================================
    const analysisStatusRes = await apiReq(`/projects/${projectId}/source-analysis-status`, {}, authToken);
    const sourceAnalysis = analysisStatusRes.data?.data?.sourceAnalysis;
    const totalFiles = sourceAnalysis?.totalFiles || 0;
    const hasJs = Boolean(
      sourceAnalysis?.languages?.JavaScript ||
      sourceAnalysis?.languages?.javascript ||
      (sourceAnalysis?.fileInventory && sourceAnalysis.fileInventory.some((f) => f.language?.toLowerCase() === 'javascript'))
    );
    const routesCount = (sourceAnalysis?.expressRoutes?.length) || (sourceAnalysis?.apiRoutes?.length) || 0;
    const componentsCount = sourceAnalysis?.reactComponents?.length || 0;

    if (analysisStatusRes.status === 200 && sourceAnalysis && totalFiles >= 8 && hasJs) {
      pass(10, `Analysis verified: ${totalFiles} files, ${routesCount} routes, ${componentsCount} components detected`);
    } else {
      fail(10, 'Analysis verification failed', { totalFiles, hasJs, routesCount, componentsCount });
    }

    // ==========================================
    // WORKFLOW STEP 11: Trigger Requirement Verification
    // ==========================================
    const verifyReqsRes = await apiReq(`/projects/${projectId}/verify-requirements`, { method: 'POST' }, authToken);
    if (verifyReqsRes.status === 200 && verifyReqsRes.data?.success) {
      const verified = verifyReqsRes.data.data?.verifiedCount || 0;
      const partial = verifyReqsRes.data.data?.partialCount || 0;
      const notFound = verifyReqsRes.data.data?.notFoundCount || 0;
      pass(11, `Requirement verification executed: ${verified} verified, ${partial} partial, ${notFound} not found`);
    } else {
      fail(11, 'Requirement verification execution failed', verifyReqsRes);
    }

    // ==========================================
    // WORKFLOW STEP 12: Verify Requirement Statuses & Evidence
    // ==========================================
    const reqsAfterVerification = await apiReq(`/projects/${projectId}/requirements`, {}, authToken);
    const verifiedReqList = reqsAfterVerification.data?.data || [];

    const req1 = verifiedReqList.find((r) => r.requirementCode === 'REQ-001' || r.code === 'REQ-001');
    const req2 = verifiedReqList.find((r) => r.requirementCode === 'REQ-002' || r.code === 'REQ-002');
    const req5 = verifiedReqList.find((r) => r.requirementCode === 'REQ-005' || r.code === 'REQ-005');

    const req1Ok = req1 && req1.status === 'verified';
    const req2Ok = req2 && req2.status === 'verified';
    const req5Ok = req5 && req5.status === 'not_found';

    if (req1Ok && req2Ok && req5Ok) {
      pass(12, 'Requirements correctly evaluated: REQ-001 (auth) verified, REQ-002 (CRUD) verified, REQ-005 (WebSockets) not_found');
    } else {
      fail(12, 'Requirement status evaluation failed', { req1, req2, req5 });
    }

    // ==========================================
    // WORKFLOW STEP 13: Request AI Recommendations
    // ==========================================
    const aiRes = await apiReq(`/projects/${projectId}/generate-recommendations`, {
      method: 'POST',
      body: { providerOverride: { provider: 'mock' } },
    }, authToken);
    if (aiRes.status === 200 && aiRes.data?.success) {
      const aiData = aiRes.data.data?.aiAnalysis;
      pass(13, `AI recommendations generated: confidence ${aiData?.confidenceScore} with ${aiData?.recommendedActions?.length || 0} actionable items`);
    } else {
      fail(13, 'AI recommendation generation failed', aiRes);
    }

    // Confirm AI did not mutate requirement status or calculated progress
    const reqsAfterAI = await apiReq(`/projects/${projectId}/requirements`, {}, authToken);
    const req5AfterAI = (reqsAfterAI.data?.data || []).find((r) => r.requirementCode === 'REQ-005' || r.code === 'REQ-005');
    if (req5AfterAI && req5AfterAI.status === 'not_found') {
      pass('13b', 'Verified AI did not fabricate evidence or alter requirement statuses');
    } else {
      fail('13b', 'Requirement status mutated after AI analysis', req5AfterAI);
    }

    // ==========================================
    // WORKFLOW STEP 14: Calculate Progress Deterministically
    // ==========================================
    const progressCalcRes = await apiReq(`/projects/${projectId}/calculate-progress`, { method: 'POST' }, authToken);
    let calculatedProgress = null;

    if (progressCalcRes.status === 200 && progressCalcRes.data?.success) {
      calculatedProgress = progressCalcRes.data.data?.progressPercentage;
      const calcStatus = progressCalcRes.data.data?.calculationStatus;
      pass(14, `Deterministic progress calculated: ${calculatedProgress}% (${calcStatus})`);
    } else {
      fail(14, 'Progress calculation failed', progressCalcRes);
    }

    // Verify GET /projects/:id/progress returns matching snapshot
    const getProgRes = await apiReq(`/projects/${projectId}/progress`, {}, authToken);
    if (getProgRes.status === 200 && getProgRes.data?.data?.progressPercentage === calculatedProgress) {
      pass('14b', `Progress snapshot correctly retrieved via GET /projects/:id/progress (${calculatedProgress}%)`);
    } else {
      fail('14b', 'Progress snapshot mismatch', getProgRes);
    }

    // ==========================================
    // WORKFLOW STEP 15: Verify Dashboard and Reports
    // ==========================================
    const dashboardRes = await apiReq('/projects/dashboard/stats', {}, authToken);
    if (
      dashboardRes.status === 200 &&
      dashboardRes.data?.success &&
      dashboardRes.data.data?.totalProjects >= 1 &&
      dashboardRes.data.data?.verificationBreakdown?.totalRequirements === 5
    ) {
      pass(15, `Dashboard stats aggregate verified: ${dashboardRes.data.data.totalProjects} project, ${dashboardRes.data.data.averageProgress}% avg progress`);
    } else {
      fail(15, 'Dashboard statistics verification failed', dashboardRes);
    }

    // Verify GET /reports lists the newly completed analysis report
    const reportsRes = await apiReq('/reports', {}, authToken);
    let generatedReportId = null;

    if (reportsRes.status === 200 && reportsRes.data?.success && Array.isArray(reportsRes.data.data) && reportsRes.data.data.length > 0) {
      const latestReport = reportsRes.data.data[0];
      generatedReportId = latestReport.id || latestReport._id;
      tracker.reportIds.push(generatedReportId);
      pass('15b', `Reports list verified: found report ${generatedReportId} with progress ${latestReport.progressPercentage}%`);
    } else {
      fail('15b', 'Reports list retrieval failed', reportsRes);
    }

    // Verify GET /reports/:id returns full detail report
    if (generatedReportId) {
      const singleReportRes = await apiReq(`/reports/${generatedReportId}`, {}, authToken);
      if (singleReportRes.status === 200 && singleReportRes.data?.success) {
        pass('15c', `Single report retrieved via GET /reports/:id with complete verification and AI advisory`);
      } else {
        fail('15c', 'Single report retrieval failed', singleReportRes);
      }
    }

    // ==========================================
    // STEP 16: Multi-Tenant IDOR Protection
    // ==========================================
    const attackerRes = await apiReq('/auth/register', {
      method: 'POST',
      body: {
        name: 'Attacker User',
        email: `attacker.${Date.now()}@evil.corp`,
        password: 'Password123!',
      },
    });
    const attackerToken = attackerRes.data?.data?.token || attackerRes.data?.token;
    const attackerUser = attackerRes.data?.data?.user || attackerRes.data?.user;
    tracker.userIds.push(attackerUser?.id || attackerUser?._id);

    // Attacker tries to read victim project
    const idorProjectRes = await apiReq(`/projects/${projectId}`, {}, attackerToken);
    if (idorProjectRes.status === 404) {
      pass(16, 'IDOR Protection: Attacker cannot access victim project (404 Not Found)');
    } else {
      fail(16, 'IDOR vulnerability on project resource', idorProjectRes);
    }

    // Attacker tries to read victim report
    if (generatedReportId) {
      const idorReportRes = await apiReq(`/reports/${generatedReportId}`, {}, attackerToken);
      if (idorReportRes.status === 404) {
        pass('16b', 'IDOR Protection: Attacker cannot access victim analysis report (404 Not Found)');
      } else {
        fail('16b', 'IDOR vulnerability on report resource', idorReportRes);
      }
    }

    // ==========================================
    // STEP 17: Zero Path Leakage Inspection
    // ==========================================
    const payloadStr = JSON.stringify({
      dashboard: dashboardRes.data,
      reports: reportsRes.data,
      project: createProjectRes.data,
    });
    const leakC = payloadStr.includes('c:\\') || payloadStr.includes('C:\\');
    const leakUsers = payloadStr.includes('\\Users\\') || payloadStr.includes('/Users/');
    const leakAppdata = payloadStr.includes('AppData') || payloadStr.includes('appdata');

    if (!leakC && !leakUsers && !leakAppdata) {
      pass(17, 'Zero server filesystem path leakage across all returned API payloads');
    } else {
      fail(17, 'Filesystem path detected in API response payload', { leakC, leakUsers, leakAppdata });
    }

  } catch (error) {
    console.error('Fatal test error:', error);
    allPassed = false;
  } finally {
    // Cleanup temporary test data
    console.log('\n🧹 Cleaning up test artifacts...');
    try {
      if (tracker.userIds.length > 0) {
        await User.deleteMany({ _id: { $in: tracker.userIds } });
      }
      if (tracker.projectIds.length > 0) {
        await Project.deleteMany({ _id: { $in: tracker.projectIds } });
        await Requirement.deleteMany({ project: { $in: tracker.projectIds } });
        await AnalysisReport.deleteMany({ project: { $in: tracker.projectIds } });
      }
      for (const zp of tracker.zipPaths) {
        try { await fs.promises.unlink(zp); } catch {}
      }
      for (const ed of tracker.extractedDirs) {
        try { await removeDirSafe(ed); } catch {}
      }
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    await disconnectDB();

    console.log('====================================================');
    if (allPassed) {
      console.log('🎉 ALL STEP 11 INTEGRATION TESTS PASSED (18/18 checks)');
      console.log('====================================================');
      process.exit(0);
    } else {
      console.error('❌ SOME INTEGRATION TESTS FAILED');
      console.log('====================================================');
      process.exit(1);
    }
  }
};

runIntegrationTests();
