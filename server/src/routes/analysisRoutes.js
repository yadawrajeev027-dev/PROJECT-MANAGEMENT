import { Router } from 'express';
import { startSourceAnalysis, getSourceAnalysisStatus } from '../controllers/analysisController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// All analysis endpoints require authentication
router.use(authenticate);

// POST /api/projects/:id/analyze-source
router.post('/:id/analyze-source', startSourceAnalysis);

// GET /api/projects/:id/source-analysis-status
router.get('/:id/source-analysis-status', getSourceAnalysisStatus);

export default router;
