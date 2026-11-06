/**
 * 404 Not Found Middleware
 * 
 * Intercepts requests to unregistered endpoints and forwards a 404 Error
 * to the centralized error handler.
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export default notFoundHandler;
