import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication Middleware
 * 
 * Verifies the incoming Bearer JWT from the Authorization header,
 * retrieves the authentic user record from MongoDB,
 * and attaches the safe user object to req.user.
 * 
 * Never trusts any user ID supplied in the request body.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed authentication token.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }

    // Retrieve active user from database (password is excluded via select: false)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Attach safe user document to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
export const authenticateToken = authenticate;
