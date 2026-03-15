// Global error handling middleware – ensure CORS header so browser doesn't hide response
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  const origin = req.get('origin');
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  const statusCode = err.statusCode || res.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse = {
    success: false,
    message: err.message || 'Server Error',
  };
  if (isDevelopment) errorResponse.stack = err.stack;
  if (err.errors) errorResponse.errors = err.errors;

  res.status(statusCode).json(errorResponse);
};

// Not Found handler (404)
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };