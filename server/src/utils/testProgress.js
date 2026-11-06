/**
 * testProgress.js
 * Step 10: Deterministic Progress Calculation & Velocity Engine — 34-test regression suite.
 *
 * Covers:
 *  1. All requirements verified = 100%
 *  2. All requirements not found = 0%
 *  3. All requirements partial = 50%
 *  4. Mixed weighted requirements (e.g., prompt example 52.5%)
 *  5. Unequal requirement weights
 *  6. Pending requirements (0% score, PROVISIONAL status)
 *  7. Needs-review requirements (0% score, PROVISIONAL status)
 *  8. Verification coverage calculation
 *  9. Provisional progress state
 *  10. Final progress state
 *  11. Zero requirements handling
 *  12. Zero total weight handling
 *  13. Invalid weights rejection (negative, NaN)
 *  14. Decimal precision
 *  15. Progress never exceeds 100%
 *  16. Progress snapshot persistence
 *  17. Historical report preservation
 *  18. Progress difference calculation
 *  19. Positive velocity calculation
 *  20. Negative velocity (project regression)
 *  21. Zero elapsed time handling
 *  22. Insufficient history (<2 reports)
 *  23. Forecast with insufficient history (<3 reports)
 *  24. Forecast with sufficient history (>=3 reports + positive velocity)
 *  25. Missing source analysis rejection (400)
 *  26. Missing requirement verification rejection (400)
 *  27. Missing authentication rejection (401)
 *  28. Invalid project ID rejection (400)
 *  29. IDOR protection (404)
 *  30. Concurrent progress calculation prevention (409 Conflict via progressLockToken)
 *  31. Requirement statuses remain unchanged
 *  32. AI results cannot influence progress
 *  33. No absolute path leakage
 *  34. Frontend progress display readiness
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

import {
  calculateProgress,
  validateWeight,
  roundPrecision,
} from '../services/progress/progressCalculator.js';
import {
  persistProgressSnapshot,
  getProgressHistory,
} from '../services/progress/progressHistoryService.js';
import { calculateVelocity } from '../services/progress/velocityCalculator.js';
import { COMPLETION_SCORES } from '../services/progress/progressConfig.js';

let serverInstance = null;
let baseUrl = '';
let allPassed = true;

const tracker = {
  userIds: [],
  projectIds: [],
  requirementIds: [],
  reportIds: [],
};

function pass(n, msg) { console.log(`  ✅ Test ${n}: ${msg}`); }
function fail(n, msg, detail) {
  console.error(`  ❌ Test ${n}: ${msg}`, detail ?? '');
  allPassed = false;
}

/** HTTP request helper */
const makeReq = (urlPath, options = {}, token = null) => {
  return new Promise((resolve) => {
    const fullUrl = new URL(baseUrl + urlPath);
    const bodyData = options.body ? JSON.stringify(options.body) : null;
    const reqOpts = {
      hostname: fullUrl.hostname,
      port: fullUrl.port,
      path: fullUrl.pathname + fullUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(bodyData ? { 'Content-Length': Buffer.byteLength(bodyData) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = http.request(reqOpts, (resp) => {
      let raw = '';
      resp.on('data', (chunk) => { raw += chunk; });
      resp.on('end', () => {
        let data = null;
        try { data = JSON.parse(raw); } catch {}
        resolve({ status: resp.statusCode, data });
      });
    });
    req.on('error', (err) => resolve({ status: 0, data: { error: err.message } }));
    if (bodyData) req.write(bodyData);
    req.end();
  });
};

/** Setup helper to build a test project ready for progress calculation */
async function setupProjectWithVerifiedRequirements(user, reqSpecs = []) {
  const project = await Project.create({
    name: `Progress Project ${Date.now()}`,
    owner: user._id,
    status: 'uploaded',
    extractionStatus: 'completed',
  });
  tracker.projectIds.push(project._id);

  const report = await AnalysisReport.create({
    project: project._id,
    status: 'completed',
    analysisVersion: '1.0.0',
    sourceAnalysis: {
      totalFiles: 5,
      functions: [{ name: 'authHandler', filePath: 'src/auth.js', startLine: 1, endLine: 20 }],
      expressRoutes: [{ method: 'POST', path: '/api/auth/login', filePath: 'src/auth.js' }],
    },
    verifiedCount: reqSpecs.filter((r) => r.status === 'verified').length,
    partialCount: reqSpecs.filter((r) => r.status === 'partial').length,
  });
  tracker.reportIds.push(report._id);
  project.latestReport = report._id;
  await project.save();

  const defaultSpecs = reqSpecs.length > 0 ? reqSpecs : [
    { requirementCode: 'REQ-01', title: 'Login API', status: 'verified', weight: 20 },
    { requirementCode: 'REQ-02', title: 'Register API', status: 'partial', weight: 15 },
    { requirementCode: 'REQ-03', title: 'Task Creation', status: 'verified', weight: 25 },
    { requirementCode: 'REQ-04', title: 'Task Deletion', status: 'not_found', weight: 20 },
    { requirementCode: 'REQ-05', title: 'Database Sync', status: 'not_found', weight: 20 },
  ];

  const requirements = [];
  for (const s of defaultSpecs) {
    const doc = await Requirement.create({
      project: project._id,
      requirementCode: s.requirementCode,
      title: s.title,
      status: s.status || 'verified',
      weight: s.weight ?? 10,
      confidence: s.confidence ?? (s.status === 'verified' ? 90 : s.status === 'partial' ? 50 : 0),
    });
    tracker.requirementIds.push(doc._id);
    requirements.push(doc);
  }

  return { project, report, requirements };
}

async function runTests() {
  console.log('====================================================');
  console.log('ProjectPulse AI – Step 10 Deterministic Progress Test Suite');
  console.log('====================================================\n');

  await connectDB(process.env.MONGODB_URI);

  // Start ephemeral HTTP server
  serverInstance = app.listen(0);
  const { port } = serverInstance.address();
  baseUrl = `http://127.0.0.1:${port}/api/projects`;
  console.log(`[Setup] Ephemeral test server listening on ${baseUrl}\n`);

  // Create test users
  const userA = await User.create({
    name: 'Alice Step10',
    email: `alice.step10.${Date.now()}@example.com`,
    password: 'Password123!',
  });
  tracker.userIds.push(userA._id);
  const tokenA = generateToken({ id: userA._id, email: userA.email });

  const userB = await User.create({
    name: 'Bob Step10',
    email: `bob.step10.${Date.now()}@example.com`,
    password: 'Password123!',
  });
  tracker.userIds.push(userB._id);
  const tokenB = generateToken({ id: userB._id, email: userB.email });

  // ───────────────────────────────────────────────────────────────────────────
  // Part 1: Deterministic Progress Rules & Math (Tests 1–15)
  // ───────────────────────────────────────────────────────────────────────────

  console.log('1. All requirements verified = 100%...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'A', status: 'verified', weight: 10 },
      { requirementCode: 'R2', title: 'B', status: 'verified', weight: 30 },
      { requirementCode: 'R3', title: 'C', status: 'verified', weight: 60 },
    ];
    const res = calculateProgress(reqs);
    if (res.progressPercentage === 100 && res.verificationCoverage === 100 && res.calculationStatus === 'FINAL') {
      pass(1, 'All verified requirements correctly evaluated to exactly 100.0% progress (FINAL).');
    } else {
      fail(1, 'All verified did not yield 100%:', res);
    }
  }

  console.log('\n2. All requirements not found = 0%...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'A', status: 'not_found', weight: 25 },
      { requirementCode: 'R2', title: 'B', status: 'not_found', weight: 75 },
    ];
    const res = calculateProgress(reqs);
    if (res.progressPercentage === 0 && res.verificationCoverage === 100 && res.calculationStatus === 'FINAL') {
      pass(2, 'All not found requirements correctly evaluated to exactly 0.0% progress (FINAL).');
    } else {
      fail(2, 'All not found did not yield 0%:', res);
    }
  }

  console.log('\n3. All requirements partial = 50%...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'A', status: 'partial', weight: 40 },
      { requirementCode: 'R2', title: 'B', status: 'partial', weight: 60 },
    ];
    const res = calculateProgress(reqs);
    if (res.progressPercentage === 50 && res.verificationCoverage === 100 && res.calculationStatus === 'FINAL') {
      pass(3, 'All partial requirements correctly earned 50.0% weighted progress (FINAL).');
    } else {
      fail(3, 'All partial did not yield 50%:', res);
    }
  }

  console.log('\n4. Mixed weighted requirements (specification example = 52.5%)...');
  {
    // Exact example from user specification:
    // Login: weight 20, VERIFIED (20 * 1.0 = 20)
    // Registration: weight 15, PARTIAL (15 * 0.5 = 7.5)
    // Create task: weight 25, VERIFIED (25 * 1.0 = 25)
    // Delete task: weight 20, NOT_FOUND (20 * 0.0 = 0)
    // MongoDB: weight 20, NOT_FOUND (20 * 0.0 = 0)
    // Total: 52.5 / 100 * 100 = 52.5%
    const reqs = [
      { requirementCode: 'REQ-LOGIN', title: 'Login', status: 'verified', weight: 20 },
      { requirementCode: 'REQ-REG', title: 'Registration', status: 'partial', weight: 15 },
      { requirementCode: 'REQ-TASK-C', title: 'Create task', status: 'verified', weight: 25 },
      { requirementCode: 'REQ-TASK-D', title: 'Delete task', status: 'not_found', weight: 20 },
      { requirementCode: 'REQ-DB', title: 'MongoDB', status: 'not_found', weight: 20 },
    ];
    const res = calculateProgress(reqs);
    if (res.progressPercentage === 52.5 && res.verificationCoverage === 100 && res.calculationStatus === 'FINAL') {
      pass(4, 'Specification example computed precisely to 52.5% progress with 100% coverage.');
    } else {
      fail(4, 'Specification example mismatch:', res);
    }
  }

  console.log('\n5. Unequal requirement weights...');
  {
    // Heavy requirement: weight 80 (verified) + light requirement: weight 20 (not found) => 80%
    const reqs = [
      { requirementCode: 'HEAVY', title: 'Core Architecture', status: 'verified', weight: 80 },
      { requirementCode: 'LIGHT', title: 'Favicon Icon', status: 'not_found', weight: 20 },
    ];
    const res = calculateProgress(reqs);
    if (res.progressPercentage === 80) {
      pass(5, 'Unequal weighting honored correctly: 80% progress earned.');
    } else {
      fail(5, 'Unequal weights failed:', res);
    }
  }

  console.log('\n6. Pending requirements (0% score, PROVISIONAL status)...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'Done', status: 'verified', weight: 50 },
      { requirementCode: 'R2', title: 'Pending Task', status: 'pending', weight: 50 },
    ];
    const res = calculateProgress(reqs);
    if (
      res.progressPercentage === 50 &&
      res.pendingCount === 1 &&
      res.pendingWeight === 50 &&
      res.calculationStatus === 'PROVISIONAL'
    ) {
      pass(6, 'Pending requirement contributed 0 points and properly flagged calculation as PROVISIONAL.');
    } else {
      fail(6, 'Pending requirement handling failed:', res);
    }
  }

  console.log('\n7. Needs-review requirements (0% score, PROVISIONAL status)...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'Done', status: 'verified', weight: 60 },
      { requirementCode: 'R2', title: 'Ambiguous Spec', status: 'needs_review', weight: 40 },
    ];
    const res = calculateProgress(reqs);
    if (
      res.progressPercentage === 60 &&
      res.needsReviewCount === 1 &&
      res.calculationStatus === 'PROVISIONAL'
    ) {
      pass(7, 'Needs-review requirement contributed 0 points and flagged calculation as PROVISIONAL.');
    } else {
      fail(7, 'Needs-review requirement handling failed:', res);
    }
  }

  console.log('\n8. Verification coverage calculation...');
  {
    // Total weight = 100.
    // Assessed: verified (40) + partial (20) + not_found (10) = 70 assessed weight.
    // Unassessed: pending (20) + needs_review (10) = 30 unassessed weight.
    // Coverage must be exactly 70.0%
    const reqs = [
      { requirementCode: 'R1', title: 'A', status: 'verified', weight: 40 },
      { requirementCode: 'R2', title: 'B', status: 'partial', weight: 20 },
      { requirementCode: 'R3', title: 'C', status: 'not_found', weight: 10 },
      { requirementCode: 'R4', title: 'D', status: 'pending', weight: 20 },
      { requirementCode: 'R5', title: 'E', status: 'needs_review', weight: 10 },
    ];
    const res = calculateProgress(reqs);
    if (res.verificationCoverage === 70 && res.assessedWeight === 70 && res.totalWeight === 100) {
      pass(8, 'Verification coverage computed independently as 70.0% of total requirement weight.');
    } else {
      fail(8, 'Verification coverage calculation mismatch:', res);
    }
  }

  console.log('\n9. Provisional progress state...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'A', status: 'verified', weight: 80 },
      { requirementCode: 'R2', title: 'B', status: 'pending', weight: 20 },
    ];
    const res = calculateProgress(reqs);
    if (res.calculationStatus === 'PROVISIONAL') {
      pass(9, 'Unassessed requirement correctly caused PROVISIONAL status.');
    } else {
      fail(9, 'Expected PROVISIONAL calculation status, got:', res.calculationStatus);
    }
  }

  console.log('\n10. Final progress state...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'A', status: 'verified', weight: 50 },
      { requirementCode: 'R2', title: 'B', status: 'not_found', weight: 50 },
    ];
    const res = calculateProgress(reqs);
    if (res.calculationStatus === 'FINAL' && res.verificationCoverage === 100) {
      pass(10, 'Complete assessment produced FINAL progress status with 100% coverage.');
    } else {
      fail(10, 'Expected FINAL calculation status, got:', res.calculationStatus);
    }
  }

  console.log('\n11. Zero requirements handling...');
  {
    const res = calculateProgress([]);
    if (
      res.totalRequirements === 0 &&
      res.progressPercentage === 0 &&
      res.verificationCoverage === 0 &&
      res.calculationStatus === 'PROVISIONAL'
    ) {
      pass(11, 'Zero requirements handled safely with 0% progress, 0% coverage, and PROVISIONAL status.');
    } else {
      fail(11, 'Zero requirements did not return safe defaults:', res);
    }
  }

  console.log('\n12. Zero total weight handling...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'A', status: 'verified', weight: 0 },
      { requirementCode: 'R2', title: 'B', status: 'partial', weight: 0 },
    ];
    const res = calculateProgress(reqs);
    if (res.totalWeight === 0 && res.progressPercentage === 0 && !isNaN(res.progressPercentage)) {
      pass(12, 'Zero total weight handled safely without division by zero.');
    } else {
      fail(12, 'Zero total weight caused NaN or error:', res);
    }
  }

  console.log('\n13. Invalid weights rejection (negative, NaN)...');
  {
    let rejectedNegative = false;
    let rejectedNaN = false;

    try {
      validateWeight(-10);
    } catch {
      rejectedNegative = true;
    }

    try {
      validateWeight('not-a-number');
    } catch {
      rejectedNaN = true;
    }

    if (rejectedNegative && rejectedNaN) {
      pass(13, 'Invalid weights (negative, non-numeric) strictly rejected with explicit validation errors.');
    } else {
      fail(13, 'Invalid weights were not both rejected:', { rejectedNegative, rejectedNaN });
    }
  }

  console.log('\n14. Decimal precision...');
  {
    // Weight 1 verified, Weight 2 not found => 1/3 = 33.3333...% => rounded to 33.33%
    const reqs = [
      { requirementCode: 'R1', title: 'One', status: 'verified', weight: 1 },
      { requirementCode: 'R2', title: 'Two', status: 'not_found', weight: 2 },
    ];
    const res = calculateProgress(reqs);
    if (res.progressPercentage === 33.33) {
      pass(14, 'Decimal precision rounded accurately to 2 decimal places (33.33%).');
    } else {
      fail(14, 'Decimal precision mismatch:', res.progressPercentage);
    }
  }

  console.log('\n15. Progress never exceeds 100%...');
  {
    const reqs = [
      { requirementCode: 'R1', title: 'Big', status: 'verified', weight: 1000 },
    ];
    const res = calculateProgress(reqs);
    if (res.progressPercentage === 100) {
      pass(15, 'Progress percentage bounded strictly at maximum 100.0%.');
    } else {
      fail(15, 'Progress exceeded 100%:', res.progressPercentage);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Part 2: Persistence & Historical Reports (Tests 16–18)
  // ───────────────────────────────────────────────────────────────────────────

  console.log('\n16. Progress snapshot persistence...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    const res = await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, tokenA);

    const updatedProj = await Project.findById(project._id);
    const updatedReport = await AnalysisReport.findById(updatedProj.latestReport);

    if (
      res.status === 200 &&
      res.data?.success &&
      updatedProj.overallProgress === 52.5 &&
      updatedReport.progressMetrics?.progressPercentage === 52.5 &&
      updatedReport.progressMetrics?.calculationStatus === 'FINAL'
    ) {
      pass(16, 'Deterministic progress metrics and snapshot persisted onto AnalysisReport and Project.');
    } else {
      fail(16, 'Persistence check failed:', { resData: res.data, overallProgress: updatedProj.overallProgress });
    }
  }

  console.log('\n17. Historical report preservation...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    // Create an older completed report with 40% progress
    const oldReport = await AnalysisReport.create({
      project: project._id,
      status: 'completed',
      analysisVersion: '1.0.0',
      sourceAnalysis: { totalFiles: 2, functions: [] },
      progressPercentage: 40,
      progressMetrics: {
        progressPercentage: 40,
        calculationStatus: 'PROVISIONAL',
        calculatedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
      },
    });
    tracker.reportIds.push(oldReport._id);

    // Calculate progress on the current project
    await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, tokenA);

    // Verify older report was not overwritten or mutated
    const checkOld = await AnalysisReport.findById(oldReport._id);
    if (checkOld && checkOld.progressMetrics?.progressPercentage === 40) {
      pass(17, `Historical report ${oldReport._id} preserved intact with its original 40.0% progress.`);
    } else {
      fail(17, 'Historical report was overwritten or corrupted!', checkOld);
    }
  }

  console.log('\n18. Progress difference calculation...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    // Add historical report (Day -2: 30%)
    const reportOld = await AnalysisReport.create({
      project: project._id,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 2),
      progressPercentage: 30,
      progressMetrics: { progressPercentage: 30, calculationStatus: 'PROVISIONAL', calculatedAt: new Date(Date.now() - 86400000 * 2) },
    });
    tracker.reportIds.push(reportOld._id);

    // Add historical report (Day -1: 45%)
    const reportMid = await AnalysisReport.create({
      project: project._id,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000 * 1),
      progressPercentage: 45,
      progressMetrics: { progressPercentage: 45, calculationStatus: 'PROVISIONAL', calculatedAt: new Date(Date.now() - 86400000 * 1) },
    });
    tracker.reportIds.push(reportMid._id);

    // Current report has 52.5%
    await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, tokenA);

    const historyRes = await makeReq(`/${project._id}/progress-history`, { method: 'GET' }, tokenA);
    const hist = historyRes.data?.data?.history || [];

    // Verify sequential progress changes: [0, +15, +7.5]
    if (hist.length >= 3 && hist[1].progressChange === 15 && hist[2].progressChange === 7.5) {
      pass(18, 'Sequential progress differences (+15.0%, +7.5%) computed accurately across historical snapshots.');
    } else {
      fail(18, 'Progress change deltas mismatched:', hist);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Part 3: Velocity & Milestone Forecasting (Tests 19–24)
  // ───────────────────────────────────────────────────────────────────────────

  console.log('\n19. Positive velocity calculation...');
  {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const t1 = new Date('2026-01-03T00:00:00Z'); // 2 days elapsed
    const history = [
      { calculatedAt: t0, progressPercentage: 20 },
      { calculatedAt: t1, progressPercentage: 40 }, // +20 points / 2 days = +10.0 pts/day
    ];
    const vel = calculateVelocity(history);
    if (vel.velocity === 10 && vel.trend === 'ADVANCING' && vel.hasSufficientHistory) {
      pass(19, `Positive velocity verified: +${vel.velocity} percentage points/day (ADVANCING).`);
    } else {
      fail(19, 'Positive velocity calculation failed:', vel);
    }
  }

  console.log('\n20. Negative velocity (project regression)...');
  {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const t1 = new Date('2026-01-03T00:00:00Z'); // 2 days elapsed
    const history = [
      { calculatedAt: t0, progressPercentage: 60 },
      { calculatedAt: t1, progressPercentage: 40 }, // -20 points / 2 days = -10.0 pts/day
    ];
    const vel = calculateVelocity(history);
    if (vel.velocity === -10 && vel.trend === 'REGRESSION') {
      pass(20, `Negative velocity handled as project regression: ${vel.velocity} percentage points/day.`);
    } else {
      fail(20, 'Negative velocity regression failed:', vel);
    }
  }

  console.log('\n21. Zero elapsed time handling...');
  {
    const t0 = new Date('2026-01-01T00:00:00Z');
    const history = [
      { calculatedAt: t0, progressPercentage: 20 },
      { calculatedAt: t0, progressPercentage: 30 }, // exactly 0 ms elapsed
    ];
    const vel = calculateVelocity(history);
    if (vel.velocity === 0 && !isNaN(vel.velocity) && vel.isZeroElapsed) {
      pass(21, 'Zero elapsed time safely evaluated without divide-by-zero (velocity = 0).');
    } else {
      fail(21, 'Zero elapsed time caused division error or NaN:', vel);
    }
  }

  console.log('\n22. Insufficient history (<2 reports)...');
  {
    const history = [{ calculatedAt: new Date(), progressPercentage: 50 }];
    const vel = calculateVelocity(history);
    if (!vel.hasSufficientHistory && vel.velocity === null && vel.trend === 'INSUFFICIENT_HISTORY') {
      pass(22, 'Single inspection snapshot correctly identified as insufficient history for velocity.');
    } else {
      fail(22, 'Insufficient history not flagged:', vel);
    }
  }

  console.log('\n23. Forecast with insufficient history (<3 reports)...');
  {
    const history = [
      { calculatedAt: new Date('2026-01-01'), progressPercentage: 20 },
      { calculatedAt: new Date('2026-01-03'), progressPercentage: 40 },
    ];
    const vel = calculateVelocity(history);
    if (!vel.forecast.isAvailable && vel.forecast.reason.includes('3')) {
      pass(23, 'Milestone forecast disabled when fewer than 3 historical snapshots exist.');
    } else {
      fail(23, 'Forecasting allowed with insufficient snapshots:', vel.forecast);
    }
  }

  console.log('\n24. Forecast with sufficient history (>=3 reports + positive velocity)...');
  {
    const history = [
      { calculatedAt: new Date('2026-01-01T00:00:00Z'), progressPercentage: 20 },
      { calculatedAt: new Date('2026-01-03T00:00:00Z'), progressPercentage: 40 },
      { calculatedAt: new Date('2026-01-05T00:00:00Z'), progressPercentage: 60 },
    ];
    // velocity = (60 - 40) / 2 = 10 pts/day. Remaining points = 40. Estimated days = 40 / 10 = 4 days.
    const vel = calculateVelocity(history);
    if (
      vel.forecast.isAvailable &&
      vel.forecast.isEstimate &&
      vel.forecast.estimatedDays === 4 &&
      vel.forecast.disclaimer.includes('linear estimate')
    ) {
      pass(24, `Milestone forecast calculated: ~${vel.forecast.estimatedDays} days to completion with explicit estimate disclaimer.`);
    } else {
      fail(24, 'Forecasting with sufficient history failed:', vel.forecast);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Part 4: API Preconditions, Security & Concurrency (Tests 25–34)
  // ───────────────────────────────────────────────────────────────────────────

  console.log('\n25. Missing source analysis rejection (400)...');
  {
    const projNoAnalysis = await Project.create({
      name: 'No Source Analysis',
      owner: userA._id,
      status: 'uploaded',
      extractionStatus: 'completed',
    });
    tracker.projectIds.push(projNoAnalysis._id);

    const res = await makeReq(`/${projNoAnalysis._id}/calculate-progress`, { method: 'POST' }, tokenA);
    if (res.status === 400 && res.data?.message?.includes('source analysis')) {
      pass(25, `Project without source analysis rejected with HTTP 400: "${res.data.message}".`);
    } else {
      fail(25, 'Expected HTTP 400 for missing source analysis, got:', res);
    }
  }

  console.log('\n26. Missing requirement verification rejection (400)...');
  {
    const projUnverified = await Project.create({
      name: 'Unverified Requirements Project',
      owner: userA._id,
      status: 'uploaded',
      extractionStatus: 'completed',
    });
    tracker.projectIds.push(projUnverified._id);

    const rep = await AnalysisReport.create({
      project: projUnverified._id,
      status: 'completed',
      sourceAnalysis: { totalFiles: 1, functions: [] },
    });
    tracker.reportIds.push(rep._id);
    await Project.updateOne({ _id: projUnverified._id }, { latestReport: rep._id });

    await Requirement.create({
      project: projUnverified._id,
      requirementCode: 'PEND-1',
      title: 'Pending Requirement',
      status: 'pending', // Unverified
    });

    const res = await makeReq(`/${projUnverified._id}/calculate-progress`, { method: 'POST' }, tokenA);
    if (res.status === 400 && res.data?.message?.includes('not been verified')) {
      pass(26, `Unverified requirements rejected with HTTP 400: "${res.data.message}".`);
    } else {
      fail(26, 'Expected HTTP 400 for unverified requirements, got:', res);
    }
  }

  console.log('\n27. Missing authentication rejection (401)...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    const postRes = await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, null);
    const getRes = await makeReq(`/${project._id}/progress`, { method: 'GET' }, null);

    if (postRes.status === 401 && getRes.status === 401) {
      pass(27, 'Unauthenticated POST and GET requests rejected with HTTP 401 Unauthorized.');
    } else {
      fail(27, 'Unauthenticated requests were not both rejected with 401:', { post: postRes.status, get: getRes.status });
    }
  }

  console.log('\n28. Invalid project ID rejection (400)...');
  {
    const res = await makeReq('/not-a-valid-id/calculate-progress', { method: 'POST' }, tokenA);
    if (res.status === 400 && res.data?.message?.includes('Invalid project ID')) {
      pass(28, 'Malformed project ID rejected with HTTP 400 Bad Request.');
    } else {
      fail(28, 'Expected HTTP 400 for malformed ID, got:', res);
    }
  }

  console.log('\n29. IDOR protection (404)...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    const postRes = await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, tokenB);
    const getRes = await makeReq(`/${project._id}/progress`, { method: 'GET' }, tokenB);
    const histRes = await makeReq(`/${project._id}/progress-history`, { method: 'GET' }, tokenB);
    const velRes = await makeReq(`/${project._id}/velocity`, { method: 'GET' }, tokenB);

    if (postRes.status === 404 && getRes.status === 404 && histRes.status === 404 && velRes.status === 404) {
      pass(29, 'Multi-tenant IDOR protection verified across all 4 endpoints (HTTP 404 Not Found).');
    } else {
      fail(29, 'IDOR protection failed:', { post: postRes.status, get: getRes.status, hist: histRes.status, vel: velRes.status });
    }
  }

  console.log('\n30. Concurrent progress calculation prevention (409 Conflict via progressLockToken)...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    // Send two concurrent requests contending for the lock with a 300ms synthetic delay
    const [req1, req2] = await Promise.all([
      makeReq(`/${project._id}/calculate-progress`, { method: 'POST', body: { delayMs: 300 } }, tokenA),
      makeReq(`/${project._id}/calculate-progress`, { method: 'POST', body: { delayMs: 300 } }, tokenA),
    ]);

    const statuses = [req1.status, req2.status].sort();
    const has200 = statuses.includes(200);
    const has409 = statuses.includes(409);

    const refreshedProj = await Project.findById(project._id);
    const lockReleased = refreshedProj.progressLockToken === null;

    if (has200 && has409 && lockReleased) {
      pass(30, 'Atomic progressLockToken prevented concurrent calculation (one 200, one 409 Conflict) and safely released.');
    } else {
      fail(30, 'Concurrent locking failed:', { statuses, lockToken: refreshedProj.progressLockToken });
    }
  }

  console.log('\n31. Requirement statuses remain unchanged...');
  {
    const { project, requirements } = await setupProjectWithVerifiedRequirements(userA);
    const initialStatuses = requirements.map((r) => ({ id: r._id.toString(), status: r.status, conf: r.confidence }));

    await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, tokenA);

    const afterReqs = await Requirement.find({ project: project._id });
    const afterStatuses = afterReqs.map((r) => ({ id: r._id.toString(), status: r.status, conf: r.confidence }));

    const intact = initialStatuses.every((init) => {
      const match = afterStatuses.find((a) => a.id === init.id);
      return match && match.status === init.status && match.conf === init.conf;
    });

    if (intact) {
      pass(31, 'Requirement statuses and confidence scores in MongoDB remained 100% invariant.');
    } else {
      fail(31, 'Requirement records mutated during progress calculation!', { initialStatuses, afterStatuses });
    }
  }

  console.log('\n32. AI results cannot influence progress...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    // Attach fabricated AI analysis claiming 100% progress
    await AnalysisReport.updateOne(
      { _id: project.latestReport },
      {
        aiAnalysis: {
          projectSummary: 'Fabricated 100% completed claim',
          status: 'completed',
          overallProgress: 100, // Untrusted AI field
        },
      }
    );

    // Calculate progress deterministically
    const res = await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, tokenA);

    // Must remain 52.5% strictly derived from verified requirement weights
    if (res.data?.data?.progressPercentage === 52.5) {
      pass(32, 'Progress derived purely from deterministic requirement weights; AI outputs strictly ignored (52.5%).');
    } else {
      fail(32, 'AI data improperly influenced progress calculation:', res.data?.data?.progressPercentage);
    }
  }

  console.log('\n33. No absolute path leakage...');
  {
    const { project } = await setupProjectWithVerifiedRequirements(userA);

    await makeReq(`/${project._id}/calculate-progress`, { method: 'POST' }, tokenA);

    const [progRes, histRes, velRes] = await Promise.all([
      makeReq(`/${project._id}/progress`, { method: 'GET' }, tokenA),
      makeReq(`/${project._id}/progress-history`, { method: 'GET' }, tokenA),
      makeReq(`/${project._id}/velocity`, { method: 'GET' }, tokenA),
    ]);

    const combinedStr = JSON.stringify({ prog: progRes.data, hist: histRes.data, vel: velRes.data });

    const hasAbsPaths =
      combinedStr.includes(process.cwd()) ||
      combinedStr.includes('\\Users\\') ||
      combinedStr.includes('/home/') ||
      combinedStr.includes('/var/') ||
      combinedStr.includes('C:\\');

    if (!hasAbsPaths && progRes.status === 200 && histRes.status === 200 && velRes.status === 200) {
      pass(33, 'Zero absolute server filesystem paths leaked across all progress API payloads.');
    } else {
      fail(33, 'Absolute path leakage detected in API responses!');
    }
  }

  console.log('\n34. Frontend progress display readiness...');
  {
    const componentPath = path.resolve(__dirname, '../../../client/src/components/details/ProgressVelocityCard.jsx');
    const pagePath = path.resolve(__dirname, '../../../client/src/pages/ProjectDetails.jsx');

    const componentContent = fs.readFileSync(componentPath, 'utf8');
    const pageContent = fs.readFileSync(pagePath, 'utf8');

    const hasCardFeatures =
      componentContent.includes('ProgressVelocityCard') &&
      componentContent.includes('Deterministic Progress') &&
      componentContent.includes('Verification Coverage') &&
      componentContent.includes('Development Velocity') &&
      componentContent.includes('Milestone Forecast') &&
      componentContent.includes('Provisional Calculation Notice');

    const hasPageIntegration =
      pageContent.includes('ProgressVelocityCard') &&
      pageContent.includes('handleRecalculateProgress') &&
      pageContent.includes('liveProgressHistory') &&
      pageContent.includes('/progress');

    if (hasCardFeatures && hasPageIntegration) {
      pass(34, 'Frontend UI components equipped with circular progress, coverage bar, velocity card, and notice banners.');
    } else {
      fail(34, 'Frontend integration missing required components or wiring.', { hasCardFeatures, hasPageIntegration });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Teardown
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n[Teardown] Purging test documents from database...');
  for (const id of tracker.requirementIds) {
    try { await Requirement.deleteOne({ _id: id }); } catch {}
  }
  for (const id of tracker.reportIds) {
    try { await AnalysisReport.deleteOne({ _id: id }); } catch {}
  }
  for (const pId of tracker.projectIds) {
    try {
      await Requirement.deleteMany({ project: pId });
      await AnalysisReport.deleteMany({ project: pId });
      await Project.deleteOne({ _id: pId });
    } catch {}
  }
  if (tracker.userIds.length > 0) {
    await User.deleteMany({ _id: { $in: tracker.userIds } });
  }
  console.log('  ✅ Database test artifacts cleanly purged.');

  serverInstance.close();
  console.log('  🔒 Ephemeral test server closed.');

  await disconnectDB();

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL 34 PROGRESS CALCULATION TESTS PASSED! 🎉');
  } else {
    console.log('❌ SOME TESTS FAILED. See output above for details.');
    process.exitCode = 1;
  }
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
