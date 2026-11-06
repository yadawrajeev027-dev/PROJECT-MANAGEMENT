/**
 * Centralized Error-Handling Middleware
 * 
 * Standardizes error responses across the entire Express application.
 * Ensures internal stack traces are hidden in production environments.
 */
export const errorHandler = (err, req, res, next) => {
  // If headers were already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);

  let message = err.message || 'Internal Server Error';

  // Handle MongoDB Atlas SSL/TLS handshake & IP whitelist errors gracefully
  if (
    message.includes('SSL alert') ||
    message.includes('tlsv1 alert') ||
    message.includes('0A000438') ||
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError'
  ) {
    message = 'Database connection error: Unable to securely connect to MongoDB Atlas. Please ensure your current IP address is whitelisted in your MongoDB Atlas Dashboard (Network Access > Add Current IP Address / 0.0.0.0/0).';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
