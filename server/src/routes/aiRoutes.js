import { Router } from 'express';
import {
  generateRecommendations,
  getRecommendations,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// All AI recommendation routes require authentication
router.use(authenticate);

// POST /api/projects/:id/generate-recommendations
router.post('/:id/generate-recommendations', generateRecommendations);

// GET /api/projects/:id/recommendations
router.get('/:id/recommendations', getRecommendations);

export default router;
