import { Router } from 'express';
import {
  createProject,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
  getDashboardStats,
  addRequirementToProject,
  updateProjectRequirement,
  deleteProjectRequirement,
} from '../controllers/projectController.js';
import { uploadProjectZip } from '../controllers/uploadController.js';
import {
  extractProject,
  getExtractionStatus,
} from '../controllers/extractionController.js';
import {
  startSourceAnalysis,
  getSourceAnalysisStatus,
} from '../controllers/analysisController.js';
import {
  verifyRequirements,
  getVerificationStatus,
  getProjectRequirements,
} from '../controllers/verificationController.js';
import {
  generateRecommendations,
  getRecommendations,
} from '../controllers/aiController.js';
import {
  calculateProjectProgress,
  getProjectProgress,
  getProjectProgressHistory,
  getProjectVelocity,
} from '../controllers/progressController.js';
import { getProjectReports } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { handleZipUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Apply authentication middleware to all project endpoints
router.use(authenticate);

// Project CRUD Routes
router.post('/', createProject);
router.get('/', getAllProjects);
router.get('/dashboard/stats', getDashboardStats);
router.get('/:id', getSingleProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Project Requirements CRUD Routes
router.get('/:id/requirements', getProjectRequirements);
router.post('/:id/requirements', addRequirementToProject);
router.put('/:id/requirements/:reqId', updateProjectRequirement);
router.delete('/:id/requirements/:reqId', deleteProjectRequirement);

// Project Reports Route
router.get('/:id/reports', getProjectReports);

// Project ZIP Upload Route
router.post('/:id/upload', handleZipUpload, uploadProjectZip);

// Project ZIP Extraction Routes
router.post('/:id/extract', extractProject);
router.get('/:id/extraction-status', getExtractionStatus);

// Step 7: Source Code Analysis Routes
router.post('/:id/analyze-source', startSourceAnalysis);
router.get('/:id/source-analysis-status', getSourceAnalysisStatus);

// Step 8: Requirement Verification Engine Routes
router.post('/:id/verify-requirements', verifyRequirements);
router.get('/:id/verification-status', getVerificationStatus);

// Step 9: AI Explanations & Actionable Recommendations Routes
router.post('/:id/generate-recommendations', generateRecommendations);
router.get('/:id/recommendations', getRecommendations);

// Step 10: Deterministic Progress Calculation & Velocity Engine Routes
router.post('/:id/calculate-progress', calculateProjectProgress);
router.get('/:id/progress', getProjectProgress);
router.get('/:id/progress-history', getProjectProgressHistory);
router.get('/:id/velocity', getProjectVelocity);

export default router;
