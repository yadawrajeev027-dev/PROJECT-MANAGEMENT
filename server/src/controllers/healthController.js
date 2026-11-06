/**
 * Health Check Controller
 * 
 * Verifies backend uptime and service availability
 * 
 * @route   GET /api/health
 * @desc    Health-check API returning operational status
 * @access  Public
 */
export const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  });
};

export default {
  getHealth,
};
