import { Router } from 'express';
import {
  verifyRequirements,
  getVerificationStatus,
  getProjectRequirements,
} from '../controllers/verificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// All verification routes require authentication
router.use(authenticate);

// POST /api/projects/:id/verify-requirements
router.post('/:id/verify-requirements', verifyRequirements);

// GET /api/projects/:id/verification-status
router.get('/:id/verification-status', getVerificationStatus);

// GET /api/projects/:id/requirements
router.get('/:id/requirements', getProjectRequirements);

export default router;
