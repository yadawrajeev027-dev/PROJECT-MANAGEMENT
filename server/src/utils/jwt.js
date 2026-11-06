import jwt from 'jsonwebtoken';

/**
 * Retrieve the active JWT Secret safely
 * Enforces requirement that production must specify a strong secret.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
    }
    return 'projectpulse_dev_jwt_secret_key_2026';
  }
  return secret;
};

const DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a signed JSON Web Token
 * 
 * @param {Object} payload - Data payload (must include user ID)
 * @param {Object} [options] - Additional sign options (e.g. expiresIn)
 * @returns {string} Signed JWT string
 */
export const generateToken = (payload, options = {}) => {
  const secret = getJwtSecret();
  const signOptions = {
    expiresIn: options.expiresIn || DEFAULT_EXPIRES_IN,
    ...options,
  };

  return jwt.sign(payload, secret, signOptions);
};

/**
 * Verify and decode a JSON Web Token
 * 
 * @param {string} token - Bearer JWT string
 * @returns {Object} Decoded token payload
 * @throws {JsonWebTokenError|TokenExpiredError} If token is invalid or expired
 */
export const verifyToken = (token) => {
  if (!token) {
    throw new Error('No token provided');
  }
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};

export default {
  generateToken,
  verifyToken,
  getJwtSecret,
};
