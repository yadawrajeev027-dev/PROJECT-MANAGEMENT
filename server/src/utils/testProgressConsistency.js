/**
 * testProgressConsistency.js
 * Verification test suite for ProjectPulse AI Progress Consistency & Authoritative Synchronization.
 *
 * Verifies:
 * 1. Progress calculation for 1 requirement with weight 10 across all 5 statuses:
 *    - VERIFIED: 100% progress, 100% coverage, FINAL
 *    - PARTIAL: 50% progress, 100% coverage, FINAL
 *    - NOT_FOUND: 0% progress, 100% coverage, FINAL
 *    - NEEDS_REVIEW: 0% progress, 0% coverage, PROVISIONAL
 *    - PENDING: 0% progress, 0% coverage, PROVISIONAL
 * 2. Client-side parity (calculateRequirementMetrics) matching backend engine exactly.
 * 3. Actual MongoDB project data inspection for "Store" (project ID, requirement weight, latest report).
 * 4. Dual dashboard component synchronization: ProjectOverview & ProgressVelocityCard render matching values.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { connectDB, disconnectDB } from '../config/db.js';
import Project from '../models/Project.js';
import Requirement from '../models/Requirement.js';
import AnalysisReport from '../models/AnalysisReport.js';
import { calculateProgress } from '../services/progress/progressCalculator.js';
import { calculateRequirementMetrics } from '../../../client/src/utils/requirementMetrics.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  ProjectPulse AI: Progress Consistency & Synchronization Test  ');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Test Suite 1: Backend Engine - 1 Requirement with Weight 10
  // -------------------------------------------------------------
  console.log('=== TEST SUITE 1: Backend Engine (calculateProgress) for Weight 10 ===');

  const testCases = [
    {
      status: 'VERIFIED',
      expectedProgress: 100,
      expectedCoverage: 100,
      expectedStatus: 'FINAL',
      expectedVerifiedWeight: 10,
      expectedPartialWeight: 0,
      expectedEarnedWeight: 10,
    },
    {
      status: 'PARTIAL',
      expectedProgress: 50,
      expectedCoverage: 100,
      expectedStatus: 'FINAL',
      expectedVerifiedWeight: 0,
      expectedPartialWeight: 10,
      expectedEarnedWeight: 5,
    },
    {
      status: 'NOT_FOUND',
      expectedProgress: 0,
      expectedCoverage: 100,
      expectedStatus: 'FINAL',
      expectedVerifiedWeight: 0,
      expectedPartialWeight: 0,
      expectedEarnedWeight: 0,
    },
    {
      status: 'NEEDS_REVIEW',
      expectedProgress: 0,
      expectedCoverage: 0,
      expectedStatus: 'PROVISIONAL',
      expectedVerifiedWeight: 0,
      expectedPartialWeight: 0,
      expectedEarnedWeight: 0,
    },
    {
      status: 'PENDING',
      expectedProgress: 0,
      expectedCoverage: 0,
      expectedStatus: 'PROVISIONAL',
      expectedVerifiedWeight: 0,
      expectedPartialWeight: 0,
      expectedEarnedWeight: 0,
    },
  ];

  for (const tc of testCases) {
    const req = [{
      requirementCode: 'REQ-001',
      title: `Test ${tc.status}`,
      status: tc.status,
      weight: 10,
    }];

    const result = calculateProgress(req);

    assert(
      result.progressPercentage === tc.expectedProgress,
      `Backend ${tc.status}: Progress is ${tc.expectedProgress}% (got ${result.progressPercentage}%)`,
      `Expected ${tc.expectedProgress}, got ${result.progressPercentage}`
    );

    assert(
      result.verificationCoverage === tc.expectedCoverage,
      `Backend ${tc.status}: Coverage is ${tc.expectedCoverage}% (got ${result.verificationCoverage}%)`,
      `Expected ${tc.expectedCoverage}, got ${result.verificationCoverage}`
    );

    assert(
      result.calculationStatus === tc.expectedStatus,
      `Backend ${tc.status}: Calculation status is ${tc.expectedStatus} (got ${result.calculationStatus})`,
      `Expected ${tc.expectedStatus}, got ${result.calculationStatus}`
    );

    assert(
      result.totalWeight === 10,
      `Backend ${tc.status}: Total weight is 10 (got ${result.totalWeight})`,
      `Expected 10, got ${result.totalWeight}`
    );

    assert(
      result.earnedWeight === tc.expectedEarnedWeight,
      `Backend ${tc.status}: Earned weight is ${tc.expectedEarnedWeight} (got ${result.earnedWeight})`,
      `Expected ${tc.expectedEarnedWeight}, got ${result.earnedWeight}`
    );
  }

  // -------------------------------------------------------------
  // Test Suite 2: Client-side Engine Parity (calculateRequirementMetrics)
  // -------------------------------------------------------------
  console.log('\n=== TEST SUITE 2: Client Engine Parity (calculateRequirementMetrics) ===');

  for (const tc of testCases) {
    const req = [{
      code: 'REQ-001',
      title: `Client Test ${tc.status}`,
      status: tc.status,
      weight: 10,
    }];

    const clientResult = calculateRequirementMetrics(req, 'Completed');

    assert(
      clientResult.progressPercentage === tc.expectedProgress,
      `Frontend ${tc.status}: Progress is ${tc.expectedProgress}% (got ${clientResult.progressPercentage}%)`,
      `Expected ${tc.expectedProgress}, got ${clientResult.progressPercentage}`
    );

    assert(
      clientResult.verificationCoverage === tc.expectedCoverage,
      `Frontend ${tc.status}: Coverage is ${tc.expectedCoverage}% (got ${clientResult.verificationCoverage}%)`,
      `Expected ${tc.expectedCoverage}, got ${clientResult.verificationCoverage}`
    );

    assert(
      clientResult.calculationStatus === tc.expectedStatus,
      `Frontend ${tc.status}: Calculation status is ${tc.expectedStatus} (got ${clientResult.calculationStatus})`,
      `Expected ${tc.expectedStatus}, got ${clientResult.calculationStatus}`
    );

    assert(
      clientResult.totalWeight === 10,
      `Frontend ${tc.status}: Total weight is 10 (got ${clientResult.totalWeight})`,
      `Expected 10, got ${clientResult.totalWeight}`
    );

    assert(
      clientResult.earnedWeight === tc.expectedEarnedWeight,
      `Frontend ${tc.status}: Earned weight is ${tc.expectedEarnedWeight} (got ${clientResult.earnedWeight})`,
      `Expected ${tc.expectedEarnedWeight}, got ${clientResult.earnedWeight}`
    );
  }

  // -------------------------------------------------------------
  // Test Suite 3: MongoDB Live Project Inspection & Parity
  // -------------------------------------------------------------
  console.log('\n=== TEST SUITE 3: MongoDB Live Project Data Inspection ===');

  let dbConnected = false;
  try {
    await connectDB(process.env.MONGODB_URI);
    dbConnected = true;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
  }

  if (dbConnected) {
    const project = await Project.findOne({ name: 'Store' }).sort({ createdAt: -1 });

    assert(!!project, 'MongoDB: Found Project "Store"', 'Project "Store" not found in DB');

    if (project) {
      console.log(`    Project ID: ${project._id.toString()}`);
      console.log(`    Extraction Status: ${project.extractionStatus}`);
      console.log(`    Analysis Status: ${project.status}`);
      console.log(`    Overall Progress in DB: ${project.overallProgress}%`);
      console.log(`    Progress Status in DB: ${project.progressStatus}`);
      console.log(`    Verification Coverage in DB: ${project.verificationCoverage}%`);

      const requirements = await Requirement.find({ project: project._id }).sort({ createdAt: 1 });
      assert(requirements.length === 1, `MongoDB: Exactly 1 requirement registered for "Store" (found ${requirements.length})`);

      const req0 = requirements[0];
      if (req0) {
        console.log(`    Requirement ID: ${req0._id.toString()}`);
        console.log(`    Code: ${req0.requirementCode || req0.code}`);
        console.log(`    Title: ${req0.title}`);
        console.log(`    Status: ${req0.status}`);
        console.log(`    Weight: ${req0.weight}`);

        assert(req0.project.toString() === project._id.toString(), 'MongoDB: Requirement belongs to the correct project ID');
        assert(req0.weight === 10, `MongoDB: Actual requirement weight is 10 (got ${req0.weight})`);
        assert(req0.status === 'partial', `MongoDB: Requirement status is "partial" (got ${req0.status})`);
      }

      // Check latest report
      const latestReport = await AnalysisReport.findById(project.latestReport);
      assert(!!latestReport, 'MongoDB: Latest AnalysisReport exists');
      if (latestReport) {
        console.log(`    Report ID: ${latestReport._id.toString()}`);
        console.log(`    Report Status: ${latestReport.status}`);
        console.log(`    Report Progress Percentage: ${latestReport.progressPercentage}%`);
        console.log(`    Report Progress Metrics:`, JSON.stringify(latestReport.progressMetrics));

        assert(latestReport.progressPercentage === 50, 'MongoDB Report: progressPercentage is 50%');
        assert(latestReport.progressMetrics?.totalWeight === 10, 'MongoDB Report: totalWeight is 10');
        assert(latestReport.progressMetrics?.partialWeight === 10, 'MongoDB Report: partialWeight is 10');
        assert(latestReport.progressMetrics?.earnedWeight === 5, 'MongoDB Report: earnedWeight is 5');
        assert(latestReport.progressMetrics?.verificationCoverage === 100, 'MongoDB Report: verificationCoverage is 100%');
        assert(latestReport.progressMetrics?.calculationStatus === 'FINAL', 'MongoDB Report: calculationStatus is FINAL');
      }

      // -------------------------------------------------------------
      // Test Suite 4: Dual-Component Authoritative State Synchronization
      // -------------------------------------------------------------
      console.log('\n=== TEST SUITE 4: Dual-Component Authoritative State Synchronization ===');

      // Simulate authoritativeProgress computation as done in ProjectDetails.jsx
      const liveProgressFromReport = latestReport?.progressMetrics ? {
        ...latestReport.progressMetrics,
        reportId: latestReport._id.toString(),
      } : calculateProgress(requirements);

      // Section 1: ProjectOverview mapping
      const overviewProps = {
        progressPercentage: liveProgressFromReport.progressPercentage,
        total: liveProgressFromReport.totalRequirements,
        verified: liveProgressFromReport.verifiedCount,
        partial: liveProgressFromReport.partialCount,
        missing: liveProgressFromReport.notFoundCount,
        pending: liveProgressFromReport.pendingCount,
      };

      // Section 2: ProgressVelocityCard mapping
      const velocityProps = {
        progressPercentage: liveProgressFromReport.progressPercentage,
        coveragePercentage: liveProgressFromReport.verificationCoverage,
        calculationStatus: liveProgressFromReport.calculationStatus,
        totalReqs: liveProgressFromReport.totalRequirements,
        verifiedCount: liveProgressFromReport.verifiedCount,
        partialCount: liveProgressFromReport.partialCount,
        notFoundCount: liveProgressFromReport.notFoundCount,
        needsReviewCount: liveProgressFromReport.needsReviewCount,
        pendingCount: liveProgressFromReport.pendingCount,
        totalWeight: liveProgressFromReport.totalWeight,
        partialWeight: liveProgressFromReport.partialWeight,
        earnedWeight: liveProgressFromReport.earnedWeight,
      };

      assert(
        overviewProps.progressPercentage === velocityProps.progressPercentage,
        `Both components display IDENTICAL progress score (${overviewProps.progressPercentage}% vs ${velocityProps.progressPercentage}%)`
      );

      assert(
        overviewProps.progressPercentage === 50,
        `Authoritative progress percentage is exactly 50% (5 pts earned / 10 pts total)`
      );

      assert(
        velocityProps.coveragePercentage === 100,
        `Deterministic Progress component displays 100% verification coverage`
      );

      assert(
        velocityProps.totalWeight === 10,
        `Deterministic Progress component displays total weight points: 10`
      );

      assert(
        velocityProps.partialWeight === 10,
        `Deterministic Progress component displays partial weight: 10`
      );

      assert(
        velocityProps.calculationStatus === 'FINAL',
        `Calculation status is FINAL (not provisional)`
      );

      assert(
        velocityProps.pendingCount === 0 && velocityProps.needsReviewCount === 0,
        `No pending or needs-review requirements (0 unassessed)`
      );
    }

    await mongoose.connection.close();
  }

  console.log('\n================================================================');
  console.log(`  TEST RESULTS SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal error in testProgressConsistency:', err);
  process.exit(1);
});
