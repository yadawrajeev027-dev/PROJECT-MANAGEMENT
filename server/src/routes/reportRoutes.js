/**
 * reportRoutes.js
 * Express router for Persisted Analysis Reports.
 */

import express from 'express';
import {
  getAllReports,
  getSingleReport,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllReports);
router.get('/:id', getSingleReport);

export default router;
