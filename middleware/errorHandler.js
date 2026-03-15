// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err.message);
  
  // Determine status code
  const statusCode = err.statusCode || res.statusCode || 500;
  
  // Development vs Production mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Build error response
  const errorResponse = {
    success: false,
    message: err.message || 'Server Error',
  };
  
  // Add stack trace only in development
  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }
  
  // Add validation errors if present
  if (err.errors) {
    errorResponse.errors = err.errors;
  }
  
  // Send response
  res.status(statusCode).json(errorResponse);
};

// Not Found handler (404)
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };