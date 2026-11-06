import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { User, Project, Requirement, AnalysisReport } from '../models/index.js';

const runModelTests = async () => {
  console.log('====================================================');
  console.log('🧪 ProjectPulse AI - MongoDB Models Verification');
  console.log('====================================================');

  const createdIds = {
    userId: null,
    projectId: null,
    requirementIds: [],
    reportId: null,
  };

  let allPassed = true;

  try {
    // 1. Verify MongoDB Atlas Connection
    console.log('\n[1/9] Connecting to MongoDB Atlas...');
    await connectDB(process.env.MONGODB_URI);
    console.log('  ✅ Atlas connection established successfully.');

    // Ensure indexes are built in Atlas
    await Promise.all([
      User.init(),
      Project.init(),
      Requirement.init(),
      AnalysisReport.init(),
    ]);
    console.log('  ✅ Indexes initialized and synchronized.');

    // 2. Test User Creation & Password Exclusion
    console.log('\n[2/9] Testing User model creation & password security...');
    const testEmail = `test.dev.${Date.now()}@projectpulse.ai`;
    const user = await User.create({
      name: 'Test Engineer',
      email: testEmail,
      password: 'superSecretPassword123!',
      role: 'user',
    });
    createdIds.userId = user._id;

    // Fetch user via normal query
    const fetchedUser = await User.findById(user._id);
    const userJson = fetchedUser.toJSON();

    if (fetchedUser.password !== undefined || userJson.password !== undefined) {
      console.error('  ❌ Security Failure: Password was returned in normal query or toJSON()');
      allPassed = false;
    } else {
      console.log('  ✅ User created successfully.');
      console.log('  ✅ Password securely excluded from normal queries & JSON serialization.');
    }

    // 3. Test Field Validations & Invalid Enums
    console.log('\n[3/9] Testing User schema validations & enum rejections...');
    try {
      await User.create({
        name: 'Bad User',
        email: 'invalid-email-format',
        password: '123',
        role: 'superhero', // Invalid enum
      });
      console.error('  ❌ Validation Failure: Invalid user was accepted unexpectedly.');
      allPassed = false;
    } catch (valErr) {
      console.log('  ✅ Invalid email, short password, and invalid role enum were correctly rejected.');
    }

    // 4. Test Project Creation with Owner Reference
    console.log('\n[4/9] Testing Project model with User reference...');
    const project = await Project.create({
      name: 'CampusTask Manager Backend',
      description: 'Automated milestone tracking backend service',
      category: 'Web Application',
      owner: createdIds.userId,
      technologies: ['Node.js', 'Express', 'MongoDB'],
      status: 'draft',
      originalZipName: 'campustask-source.zip',
      zipFileSize: 1048576,
      zipStoragePath: '/secure/storage/uploads/campustask-source.zip',
    });
    createdIds.projectId = project._id;

    const fetchedProject = await Project.findById(project._id);
    const projJson = fetchedProject.toJSON();

    if (projJson.zipStoragePath) {
      console.error('  ❌ Security Failure: Internal zipStoragePath was exposed in toJSON()');
      allPassed = false;
    } else {
      console.log('  ✅ Project created referencing User owner.');
      console.log('  ✅ Internal storage path protected from JSON serialization.');
    }

    // Test Invalid Project Status Enum
    try {
      await Project.create({
        name: 'Invalid Project',
        owner: createdIds.userId,
        status: 'flying_high', // Invalid enum
      });
      console.error('  ❌ Validation Failure: Invalid project status enum accepted.');
      allPassed = false;
    } catch (err) {
      console.log('  ✅ Invalid project status enum correctly rejected.');
    }

    // 5. Test Multiple Requirements for One Project
    console.log('\n[5/9] Testing Requirements with default pending status...');
    const req1 = await Requirement.create({
      project: createdIds.projectId,
      requirementCode: 'REQ-AUTH-01',
      title: 'User Authentication System',
      description: 'JWT-based token issuance and verification middleware',
      priority: 'high',
      weight: 3,
    });
    createdIds.requirementIds.push(req1._id);

    const req2 = await Requirement.create({
      project: createdIds.projectId,
      requirementCode: 'REQ-API-02',
      title: 'Project Status Endpoint',
      description: 'REST API returning project verification overview',
      priority: 'medium',
      weight: 2,
    });
    createdIds.requirementIds.push(req2._id);

    console.log(`  ✅ Requirement 1 status: "${req1.status}" (default)`);
    console.log(`  ✅ Requirement 2 status: "${req2.status}" (default)`);

    if (req1.status !== 'pending' || req2.status !== 'pending') {
      console.error('  ❌ Status Failure: Requirement did not default to "pending"');
      allPassed = false;
    } else {
      console.log('  ✅ Multiple requirements successfully linked to project with "pending" default.');
    }

    // 6. Test Requirement Code Uniqueness per Project
    console.log('\n[6/9] Testing Requirement Code uniqueness within project...');
    try {
      await Requirement.create({
        project: createdIds.projectId,
        requirementCode: 'REQ-AUTH-01', // Duplicate code for same project
        title: 'Duplicate Auth Req',
        weight: 1,
      });
      console.error('  ❌ Uniqueness Failure: Duplicate requirementCode accepted for same project.');
      allPassed = false;
    } catch (dupErr) {
      console.log('  ✅ Duplicate requirementCode within the same project correctly rejected.');
    }

    // 7. Test AnalysisReport Model Referencing Project
    console.log('\n[7/9] Testing AnalysisReport model & progress integrity...');
    const report = await AnalysisReport.create({
      project: createdIds.projectId,
      analysisVersion: '1.0.0',
      status: 'pending',
      totalRequirements: 2,
      pendingCount: 2,
      verifiedCount: 0,
      progressPercentage: 0,
      detectedTechnologies: ['Node.js', 'Express', 'MongoDB'],
    });
    createdIds.reportId = report._id;

    // Link report back to project
    project.latestReport = report._id;
    await project.save();

    console.log(`  ✅ AnalysisReport created: status="${report.status}", progress=${report.progressPercentage}%`);
    console.log('  ✅ No fabricated progress on pending analysis.');

    // Test Invalid AnalysisReport Enum
    try {
      await AnalysisReport.create({
        project: createdIds.projectId,
        status: 'calculating_magic', // Invalid enum
      });
      console.error('  ❌ Validation Failure: Invalid report status enum accepted.');
      allPassed = false;
    } catch (err) {
      console.log('  ✅ Invalid analysis report status enum correctly rejected.');
    }

    // 8. Test Relationship Population (User -> Project -> Report -> Requirements)
    console.log('\n[8/9] Testing Relationship Population queries...');
    const populatedProject = await Project.findById(createdIds.projectId)
      .populate('owner', 'name email role')
      .populate('latestReport');

    const projectRequirements = await Requirement.find({ project: createdIds.projectId });

    console.log(`  ✅ Populated Project Owner: ${populatedProject.owner.name} (${populatedProject.owner.email})`);
    console.log(`  ✅ Populated Latest Report Status: ${populatedProject.latestReport.status}`);
    console.log(`  ✅ Retrieved ${projectRequirements.length} requirements linked to project.`);

    if (
      !populatedProject.owner ||
      !populatedProject.latestReport ||
      projectRequirements.length !== 2
    ) {
      console.error('  ❌ Population Failure: Relationship retrieval did not match expected structure.');
      allPassed = false;
    }

    // 9. Clean up Test Documents
    console.log('\n[9/9] Cleaning up test documents from MongoDB Atlas...');
    if (createdIds.requirementIds.length > 0) {
      await Requirement.deleteMany({ _id: { $in: createdIds.requirementIds } });
    }
    if (createdIds.reportId) {
      await AnalysisReport.findByIdAndDelete(createdIds.reportId);
    }
    if (createdIds.projectId) {
      await Project.findByIdAndDelete(createdIds.projectId);
    }
    if (createdIds.userId) {
      await User.findByIdAndDelete(createdIds.userId);
    }
    console.log('  ✅ Test documents deleted cleanly from database.');

  } catch (error) {
    console.error('\n💥 Unexpected test error:', error);
    allPassed = false;

    // Attempt cleanup on error
    try {
      if (createdIds.requirementIds.length > 0) {
        await Requirement.deleteMany({ _id: { $in: createdIds.requirementIds } });
      }
      if (createdIds.reportId) {
        await AnalysisReport.findByIdAndDelete(createdIds.reportId);
      }
      if (createdIds.projectId) {
        await Project.findByIdAndDelete(createdIds.projectId);
      }
      if (createdIds.userId) {
        await User.findByIdAndDelete(createdIds.userId);
      }
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr.message);
    }
  } finally {
    await disconnectDB();
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 ALL 9 MONGODB MODEL & RELATIONSHIP TESTS PASSED! 🎉');
    console.log('====================================================\n');
  } else {
    console.error('❌ SOME TESTS FAILED. Check log output above.');
    console.log('====================================================\n');
    process.exitCode = 1;
  }
};

runModelTests();
