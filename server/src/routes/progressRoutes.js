/**
 * progressRoutes.js
 * Express router for Step 10: Deterministic Progress Calculation & Velocity Engine.
 */

import express from 'express';
import {
  calculateProjectProgress,
  getProjectProgress,
  getProjectProgressHistory,
  getProjectVelocity,
} from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All progress endpoints require valid user authentication
router.use(authenticateToken);

router.post('/:id/calculate-progress', calculateProjectProgress);
router.get('/:id/progress', getProjectProgress);
router.get('/:id/progress-history', getProjectProgressHistory);
router.get('/:id/velocity', getProjectVelocity);

export default router;
