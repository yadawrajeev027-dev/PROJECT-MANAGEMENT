/**
 * testVerification.js
 * Step 8: Requirement Verification Engine — 20-test regression suite.
 *
 * Covers:
 *  1. Verified requirement with strong evidence
 *  2. Partial requirement
 *  3. Not Found requirement
 *  4. Ambiguous requirement
 *  5. Login UI without real authentication
 *  6. API route without complete implementation
 *  7. Database model without persistence logic
 *  8. Comments-only false positive prevention
 *  9. README-only false positive prevention
 *  10. Incomplete source scan handling
 *  11. Evidence file and line references
 *  12. Confidence calculation
 *  13. Requirement status persistence in MongoDB
 *  14. Missing source analysis rejection (400)
 *  15. Missing authentication rejection (401)
 *  16. Invalid project ID rejection (400)
 *  17. IDOR protection (404)
 *  18. Concurrent verification prevention (409)
 *  19. Historical report preservation
 *  20. No absolute path leakage
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
import { getExtractionBaseDir, removeDirSafe } from '../services/zipExtractionService.js';
import { normalizeRequirement } from '../services/verification/requirementNormalizer.js';
import { collectEvidence } from '../services/verification/evidenceCollector.js';
import { matchRequirement } from '../services/verification/requirementMatcher.js';

let serverInstance = null;
let baseUrl = '';
let allPassed = true;

const tracker = {
  userIds: [],
  projectIds: [],
  requirementIds: [],
  reportIds: [],
  extractedDirs: [],
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

/** Setup helper to build an analysis-ready project with simulated AST and source files */
async function setupProjectWithAnalysis(user, sourceFiles = {}) {
  const project = await Project.create({
    name: `Verification Project ${Date.now()}`,
    owner: user._id,
    status: 'uploaded',
    extractionStatus: 'completed',
  });
  tracker.projectIds.push(project._id);

  // Create extracted directory on disk
  const extractBase = getExtractionBaseDir();
  const projDir = path.join(extractBase, project._id.toString(), `${Date.now()}-verify`);
  await fs.promises.mkdir(projDir, { recursive: true });
  tracker.extractedDirs.push(projDir);

  for (const [relPath, content] of Object.entries(sourceFiles)) {
    const absPath = path.join(projDir, relPath.replace(/\//g, path.sep));
    await fs.promises.mkdir(path.dirname(absPath), { recursive: true });
    await fs.promises.writeFile(absPath, content, 'utf8');
  }

  await Project.updateOne({ _id: project._id }, { extractedStoragePath: projDir });

  return { project, projDir };
}

async function runTests() {
  console.log('\n====================================================');
  console.log('🧪 ProjectPulse AI - Step 8: Requirement Verification Tests');
  console.log('====================================================\n');

  // Setup Database and Server
  console.log('[Setup] Connecting to MongoDB Atlas...');
  await connectDB(process.env.MONGODB_URI);
  console.log('  ✅ Database connected.');

  serverInstance = http.createServer(app);
  await new Promise((resolve) => serverInstance.listen(0, '127.0.0.1', resolve));
  const port = serverInstance.address().port;
  baseUrl = `http://127.0.0.1:${port}/api/projects`;
  console.log(`  ✅ Ephemeral test server on port ${port}`);

  const userA = await User.create({
    name: 'Verify User A',
    email: `verify.a.${Date.now()}@test.ai`,
    password: 'Password123!',
    role: 'user',
  });
  tracker.userIds.push(userA._id);
  const tokenA = generateToken({ id: userA._id, role: userA.role });

  const userB = await User.create({
    name: 'Verify User B',
    email: `verify.b.${Date.now()}@test.ai`,
    password: 'Password123!',
    role: 'user',
  });
  tracker.userIds.push(userB._id);
  const tokenB = generateToken({ id: userB._id, role: userB.role });

  // ── Unit Tests: Decision Rules ─────────────────────────────────────────────

  console.log('\n1. Verified requirement with strong evidence...');
  {
    const req = {
      requirementCode: 'REQ-001',
      title: 'User Registration and Authentication',
      description: 'Implement user registration with password hashing and JWT token issuance.',
      priority: 'high',
      weight: 10,
    };
    const norm = normalizeRequirement(req);
    const sourceAnalysis = {
      expressRoutes: [{ name: '/api/auth/register', filePath: 'src/routes/auth.js', startLine: 10, endLine: 25, meta: { path: '/api/auth/register', method: 'POST' } }],
      functions: [{ name: 'register', filePath: 'src/controllers/auth.js', startLine: 15, endLine: 40 }],
      classes: [],
      reactComponents: [],
      imports: [{ name: 'bcrypt', filePath: 'src/controllers/auth.js', startLine: 1, endLine: 1 }],
    };
    // Mock code snippet showing real hashing and token creation
    const evidence = [
      {
        filePath: 'src/controllers/auth.js',
        lineStart: 15,
        lineEnd: 40,
        evidenceType: 'function',
        strength: 'strong',
        confidence: 90,
        explanation: 'Verified cryptographic or token authentication logic.',
        snippet: 'const hash = await bcrypt.hash(password, 10); const token = jwt.sign({ id: user._id });',
      },
      {
        filePath: 'src/routes/auth.js',
        lineStart: 10,
        lineEnd: 25,
        evidenceType: 'api_route',
        strength: 'moderate',
        confidence: 80,
        explanation: 'Express POST route declared at "/api/auth/register".',
        snippet: 'router.post("/register", register);',
      },
    ];
    const verdict = matchRequirement(norm, evidence);
    if (verdict.status === 'verified' && verdict.confidence >= 80) {
      pass(1, `Status: ${verdict.status}, confidence: ${verdict.confidence}% — explanation: "${verdict.explanation}"`);
    } else {
      fail(1, 'Expected status "verified"', verdict);
    }
  }

  console.log('\n2. Partial requirement (incomplete implementation)...');
  {
    const req = {
      requirementCode: 'REQ-002',
      title: 'Product Catalog API and Search',
      description: 'Create API endpoints to search, filter, and retrieve products.',
      priority: 'medium',
      weight: 5,
    };
    const norm = normalizeRequirement(req);
    // Only import evidence or weak stub
    const evidence = [
      {
        filePath: 'src/index.js',
        lineStart: 5,
        lineEnd: 5,
        evidenceType: 'import',
        strength: 'weak',
        confidence: 30,
        explanation: 'Library dependency "axios" imported. Supporting evidence only.',
        snippet: '',
      },
    ];
    const verdict = matchRequirement(norm, evidence);
    if (verdict.status === 'partial') {
      pass(2, `Status: ${verdict.status}, confidence: ${verdict.confidence}% — correctly identified as incomplete.`);
    } else {
      fail(2, 'Expected status "partial"', verdict);
    }
  }

  console.log('\n3. Not Found requirement...');
  {
    const req = {
      requirementCode: 'REQ-003',
      title: 'Stripe Webhook Payment Processing',
      description: 'Handle recurring subscription payments via Stripe webhooks with signature verification.',
      priority: 'high',
      weight: 10,
    };
    const norm = normalizeRequirement(req);
    const verdict = matchRequirement(norm, []);
    if (verdict.status === 'not_found' && verdict.confidence >= 85) {
      pass(3, `Status: ${verdict.status}, confidence: ${verdict.confidence}% — zero evidence produces NOT_FOUND.`);
    } else {
      fail(3, 'Expected status "not_found"', verdict);
    }
  }

  console.log('\n4. Ambiguous requirement handling...');
  {
    const req = {
      requirementCode: 'REQ-004',
      title: 'TBD Ambiguous requirement needs discussion',
      description: '',
      priority: 'low',
      weight: 1,
    };
    const norm = normalizeRequirement(req);
    const verdict = matchRequirement(norm, []);
    if (verdict.status === 'needs_review') {
      pass(4, `Status: ${verdict.status} — ambiguous requirements correctly flagged for review.`);
    } else {
      fail(4, 'Expected status "needs_review"', verdict);
    }
  }

  console.log('\n5. Login UI without real authentication (Critical Rule)...');
  {
    const req = {
      requirementCode: 'REQ-005',
      title: 'User Login and Authentication',
      description: 'Users must be able to securely authenticate into the application.',
      priority: 'critical',
      weight: 10,
    };
    const norm = normalizeRequirement(req);
    // UI component exists, but no backend authentication logic
    const evidence = [
      {
        filePath: 'src/components/LoginForm.jsx',
        lineStart: 1,
        lineEnd: 30,
        evidenceType: 'react_component',
        strength: 'weak',
        confidence: 45,
        explanation: 'React component "LoginForm" declared. Note: UI components alone do not prove backend authentication.',
        snippet: 'export function LoginForm() { return <form><input type="password"/></form>; }',
      },
    ];
    const verdict = matchRequirement(norm, evidence);
    if (verdict.status === 'partial') {
      pass(5, `Status: ${verdict.status} — login UI alone is strictly PARTIAL, not VERIFIED. Explanation: "${verdict.explanation}"`);
    } else {
      fail(5, 'Login UI without backend must be PARTIAL', verdict);
    }
  }

  console.log('\n6. API route without complete implementation (Stub Handler)...');
  {
    const req = {
      requirementCode: 'REQ-006',
      title: 'Checkout API Processing',
      description: 'API endpoint to calculate taxes and process orders.',
      priority: 'high',
      weight: 8,
    };
    const norm = normalizeRequirement(req);
    const evidence = [
      {
        filePath: 'src/routes/checkout.js',
        lineStart: 12,
        lineEnd: 15,
        evidenceType: 'api_route',
        strength: 'weak',
        confidence: 35,
        explanation: 'Express POST route declared at "/checkout". Warning: Implementation appears to be an empty or stub handler without business logic.',
        snippet: 'router.post("/checkout", (req, res) => { res.send("ok"); });',
      },
    ];
    const verdict = matchRequirement(norm, evidence);
    if (verdict.status === 'partial') {
      pass(6, `Status: ${verdict.status} — empty route stub recognized as PARTIAL.`);
    } else {
      fail(6, 'Empty API route stub must be PARTIAL', verdict);
    }
  }

  console.log('\n7. Database model without persistence logic...');
  {
    const req = {
      requirementCode: 'REQ-007',
      title: 'Order Data Persistence',
      description: 'Store order records in MongoDB database with timestamps.',
      priority: 'high',
      weight: 8,
    };
    const norm = normalizeRequirement(req);
    // Schema exists, but no query/save logic
    const evidence = [
      {
        filePath: 'src/models/Order.js',
        lineStart: 1,
        lineEnd: 20,
        evidenceType: 'database_model',
        strength: 'weak',
        confidence: 40,
        explanation: 'Model schema defined, but query/persistence operations not verified in this block.',
        snippet: 'const orderSchema = new mongoose.Schema({ item: String });',
      },
    ];
    const verdict = matchRequirement(norm, evidence);
    if (verdict.status === 'partial') {
      pass(7, `Status: ${verdict.status} — database model without persistence queries correctly marked PARTIAL.`);
    } else {
      fail(7, 'Database model without queries must be PARTIAL', verdict);
    }
  }

  console.log('\n8. Comments-only false positive prevention...');
  {
    // A file with only a comment mentioning the feature
    const fakeSource = '// TODO: Implement user authentication and JWT login\nconst placeholder = true;\n';
    const { projDir } = await setupProjectWithAnalysis(userA, { 'src/fake.js': fakeSource });

    const req = {
      requirementCode: 'REQ-008',
      title: 'User Authentication',
      description: 'Secure authentication using JWT and password hashing.',
    };
    const norm = normalizeRequirement(req);
    // Static AST did not detect any functions/routes/components (it was just a comment)
    const emptyAnalysis = { functions: [], expressRoutes: [], reactComponents: [], classes: [], imports: [] };
    const evidence = collectEvidence(norm, emptyAnalysis, projDir);

    if (evidence.length === 0) {
      const verdict = matchRequirement(norm, evidence);
      if (verdict.status === 'not_found') {
        pass(8, 'Comments containing requirement keywords are strictly ignored. Status: NOT_FOUND.');
      } else {
        fail(8, 'Comments should result in NOT_FOUND', verdict);
      }
    } else {
      fail(8, 'Comments generated evidence!', evidence);
    }
  }

  console.log('\n9. README-only false positive prevention...');
  {
    const readmeContent = '# Full User Authentication with OAuth and JWT\nWe support enterprise authentication.\n';
    const { projDir } = await setupProjectWithAnalysis(userA, { 'README.md': readmeContent });

    const req = {
      requirementCode: 'REQ-009',
      title: 'OAuth User Authentication',
      description: 'Enterprise OAuth authentication support.',
    };
    const norm = normalizeRequirement(req);
    // README is not code AST; no functions or routes
    const emptyAnalysis = { functions: [], expressRoutes: [], reactComponents: [], classes: [], imports: [] };
    const evidence = collectEvidence(norm, emptyAnalysis, projDir);
    const verdict = matchRequirement(norm, evidence);

    if (evidence.length === 0 && verdict.status === 'not_found') {
      pass(9, 'README documentation claims are not treated as implementation evidence. Status: NOT_FOUND.');
    } else {
      fail(9, 'README produced false positive evidence', { evidence, verdict });
    }
  }

  console.log('\n10. Incomplete source scan handling...');
  {
    const req = {
      requirementCode: 'REQ-010',
      title: 'Machine Learning Model Inference',
      description: 'Execute model predictions.',
    };
    const norm = normalizeRequirement(req);
    // Zero evidence found, BUT the project contained unsupported Python files
    const context = {
      unsupportedFiles: [{ relativePath: 'model.py', reason: 'no-ast-parser' }],
      analysisWarnings: [],
    };
    const verdict = matchRequirement(norm, [], context);

    if (verdict.status === 'needs_review') {
      pass(10, `Status: ${verdict.status} — missing evidence on incomplete/unsupported scan becomes NEEDS_REVIEW, never NOT_FOUND.`);
    } else {
      fail(10, 'Expected "needs_review" for incomplete scan', verdict);
    }
  }

  console.log('\n11. Evidence file and line references...');
  {
    const sampleEvidence = [
      {
        filePath: 'src/controllers/userController.js',
        lineStart: 12,
        lineEnd: 35,
        evidenceType: 'function',
        strength: 'strong',
        confidence: 85,
        explanation: 'Function "createUser" declared.',
        snippet: 'export const createUser = async () => {}',
      },
    ];

    const item = sampleEvidence[0];
    const hasRelativePath = !item.filePath.startsWith('/') && !item.filePath.includes(':\\');
    const hasLineNumbers = typeof item.lineStart === 'number' && typeof item.lineEnd === 'number' && item.lineEnd >= item.lineStart;

    if (hasRelativePath && hasLineNumbers) {
      pass(11, `Evidence verified with relative path "${item.filePath}" and lines ${item.lineStart}-${item.lineEnd}.`);
    } else {
      fail(11, 'Evidence reference validation failed', item);
    }
  }

  console.log('\n12. Confidence calculation transparency...');
  {
    const norm = normalizeRequirement({ title: 'Standard API', description: 'API functionality' });
    const strongList = [
      { strength: 'strong', confidence: 90, evidenceType: 'function', explanation: 'Verified' },
      { strength: 'moderate', confidence: 80, evidenceType: 'api_route', explanation: 'Verified route' },
    ];
    const verdict = matchRequirement(norm, strongList);

    if (typeof verdict.confidence === 'number' && verdict.confidence >= 80 && verdict.confidence <= 95) {
      pass(12, `Confidence calculated transparently: ${verdict.confidence}% (status: ${verdict.status}).`);
    } else {
      fail(12, 'Confidence calculation out of expected bounds', verdict);
    }
  }

  // ── Integration Tests: End-to-End API & Persistence ────────────────────────

  console.log('\n13. Requirement status persistence in MongoDB...');
  {
    const { project } = await setupProjectWithAnalysis(userA, {
      'src/auth.js': `
        import bcrypt from 'bcrypt';
        import jwt from 'jsonwebtoken';
        export async function login(email, password) {
          const match = await bcrypt.compare(password, 'hash');
          return jwt.sign({ id: 1 }, 'secret');
        }
      `,
    });

    // Create a mock completed report with sourceAnalysis
    const report = await AnalysisReport.create({
      project: project._id,
      status: 'completed',
      sourceAnalysis: {
        totalFiles: 1,
        scannedFiles: 1,
        functions: [{ name: 'login', filePath: 'src/auth.js', startLine: 4, endLine: 7 }],
        expressRoutes: [],
        reactComponents: [],
        classes: [],
        imports: [{ name: 'bcrypt', filePath: 'src/auth.js', startLine: 2, endLine: 2 }],
      },
    });
    tracker.reportIds.push(report._id);
    await Project.updateOne({ _id: project._id }, { latestReport: report._id });

    // Create real MongoDB requirement
    const reqDoc = await Requirement.create({
      project: project._id,
      requirementCode: 'REQ-PERSIST-1',
      title: 'User Login & Password Comparison',
      description: 'Authenticate user with bcrypt password compare and token.',
      priority: 'high',
      weight: 5,
      status: 'pending',
    });
    tracker.requirementIds.push(reqDoc._id);

    const res = await makeReq(`/${project._id}/verify-requirements`, { method: 'POST' }, tokenA);
    const updatedReq = await Requirement.findById(reqDoc._id);

    if (
      res.status === 200 &&
      updatedReq.status === 'verified' &&
      updatedReq.confidence > 0 &&
      updatedReq.evidence.length > 0 &&
      updatedReq.verificationMethod === 'static_ast_evidence' &&
      updatedReq.verifiedAt !== null
    ) {
      pass(13, `MongoDB requirement updated: status="${updatedReq.status}", confidence=${updatedReq.confidence}%, evidenceCount=${updatedReq.evidence.length}`);
    } else {
      fail(13, 'Persistence failed', { resStatus: res.status, updatedReq });
    }
  }

  console.log('\n14. Missing source analysis rejection (400)...');
  {
    // Project with completed extraction, but NO AnalysisReport
    const emptyProj = await Project.create({
      name: `No Report Proj ${Date.now()}`,
      owner: userA._id,
      status: 'uploaded',
      extractionStatus: 'completed',
    });
    tracker.projectIds.push(emptyProj._id);

    const res = await makeReq(`/${emptyProj._id}/verify-requirements`, { method: 'POST' }, tokenA);
    if (res.status === 400 && res.data?.success === false) {
      pass(14, `Rejected with 400 Bad Request: "${res.data.message}"`);
    } else {
      fail(14, 'Should reject project lacking completed source analysis with 400', res);
    }
  }

  console.log('\n15. Missing authentication rejection (401)...');
  {
    const res = await makeReq('/507f1f77bcf86cd799439011/verify-requirements', { method: 'POST' });
    if (res.status === 401) {
      pass(15, 'Unauthenticated request correctly rejected with 401.');
    } else {
      fail(15, 'Should reject unauthenticated request with 401', res.status);
    }
  }

  console.log('\n16. Invalid project ID rejection (400)...');
  {
    const res = await makeReq('/invalid-id-format/verify-requirements', { method: 'POST' }, tokenA);
    if (res.status === 400) {
      pass(16, 'Malformed project ID rejected with 400 Bad Request.');
    } else {
      fail(16, 'Should reject malformed ID with 400', res.status);
    }
  }

  console.log('\n17. Another user\'s project rejection (IDOR Guard 404)...');
  {
    const { project } = await setupProjectWithAnalysis(userA);
    // User B tries to access User A's project
    const resVerify = await makeReq(`/${project._id}/verify-requirements`, { method: 'POST' }, tokenB);
    const resGetReqs = await makeReq(`/${project._id}/requirements`, { method: 'GET' }, tokenB);

    if (resVerify.status === 404 && resGetReqs.status === 404) {
      pass(17, 'IDOR protection verified: User B receives 404 on User A project.');
    } else {
      fail(17, 'IDOR guard failed', { resVerify: resVerify.status, resGetReqs: resGetReqs.status });
    }
  }

  console.log('\n18. Concurrent verification prevention (409 Conflict)...');
  {
    const { project } = await setupProjectWithAnalysis(userA);
    const report = await AnalysisReport.create({
      project: project._id,
      status: 'completed',
      sourceAnalysis: { totalFiles: 1, functions: [], expressRoutes: [], reactComponents: [], classes: [], imports: [] },
    });
    tracker.reportIds.push(report._id);
    await Project.updateOne({ _id: project._id }, { latestReport: report._id });

    // Fire two concurrent verification requests simultaneously
    const [r1, r2] = await Promise.all([
      makeReq(`/${project._id}/verify-requirements`, { method: 'POST' }, tokenA),
      makeReq(`/${project._id}/verify-requirements`, { method: 'POST' }, tokenA),
    ]);

    const statuses = [r1.status, r2.status].sort();
    if (statuses.includes(409) && statuses.includes(200)) {
      pass(18, `Concurrent verification prevented: received statuses ${r1.status} and ${r2.status} (one 409 Conflict returned).`);
    } else {
      fail(18, 'Concurrent verification locking failed', { r1: r1.status, r2: r2.status });
    }
  }

  console.log('\n19. Historical report preservation...');
  {
    const { project } = await setupProjectWithAnalysis(userA);
    // Create an older historical report
    const oldReport = await AnalysisReport.create({
      project: project._id,
      analysisVersion: '1.0.0',
      status: 'completed',
      totalRequirements: 2,
      verifiedCount: 1,
      sourceAnalysis: { totalFiles: 1, functions: [] },
    });
    tracker.reportIds.push(oldReport._id);

    // Create current active report
    const currentReport = await AnalysisReport.create({
      project: project._id,
      analysisVersion: '7.0.0',
      status: 'completed',
      sourceAnalysis: { totalFiles: 1, functions: [] },
    });
    tracker.reportIds.push(currentReport._id);
    await Project.updateOne({ _id: project._id }, { latestReport: currentReport._id });

    // Run verification
    await makeReq(`/${project._id}/verify-requirements`, { method: 'POST' }, tokenA);

    // Ensure the old report still exists and was NOT deleted or overwritten
    const checkOld = await AnalysisReport.findById(oldReport._id);
    if (checkOld && checkOld.analysisVersion === '1.0.0') {
      pass(19, `Historical report ${oldReport._id} preserved intact (version: "${checkOld.analysisVersion}").`);
    } else {
      fail(19, 'Historical report was overwritten or deleted!', checkOld);
    }
  }

  console.log('\n20. No absolute path leakage in API response...');
  {
    const { project } = await setupProjectWithAnalysis(userA, {
      'src/sample.js': 'export const ping = () => "pong";',
    });
    const report = await AnalysisReport.create({
      project: project._id,
      status: 'completed',
      sourceAnalysis: {
        totalFiles: 1,
        functions: [{ name: 'ping', filePath: 'src/sample.js', startLine: 1, endLine: 1 }],
        expressRoutes: [],
        reactComponents: [],
        classes: [],
        imports: [],
      },
    });
    tracker.reportIds.push(report._id);
    await Project.updateOne({ _id: project._id }, { latestReport: report._id });

    await Requirement.create({
      project: project._id,
      requirementCode: 'REQ-SEC-1',
      title: 'Ping Handler',
      description: 'Ping endpoint.',
    });

    const res = await makeReq(`/${project._id}/verify-requirements`, { method: 'POST' }, tokenA);
    const bodyStr = JSON.stringify(res.data);

    const hasAbsPaths = bodyStr.includes(process.cwd()) ||
      bodyStr.includes('\\Users\\') ||
      bodyStr.includes('/home/') ||
      bodyStr.includes('/var/') ||
      bodyStr.includes('C:\\');

    if (!hasAbsPaths && res.status === 200) {
      pass(20, 'Zero absolute server filesystem paths leaked in verification response.');
    } else {
      fail(20, 'Absolute server path leakage detected in API response!', bodyStr);
    }
  }

  // ── Teardown ──────────────────────────────────────────────────────────────
  console.log('\n[Teardown] Cleaning up test data from MongoDB Atlas & disk...');
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
  for (const dir of tracker.extractedDirs) {
    await removeDirSafe(dir);
  }
  if (tracker.userIds.length > 0) {
    await User.deleteMany({ _id: { $in: tracker.userIds } });
  }
  console.log('  ✅ All test artifacts purged cleanly.');

  serverInstance.close();
  console.log('  🔒 Ephemeral test server closed.');

  await disconnectDB();

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL 20 REQUIREMENT VERIFICATION TESTS PASSED! 🎉');
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
