'use strict';

/**
 * Global Express error handler.
 * Returns JSON errors; includes stack trace only in development.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;

  // Handle specific known error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
  }
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
  }

  // In production, mask internal 500 database/driver errors to prevent leaking schema or credentials
  let message = err.message || 'Internal Server Error';
  if (!isDev && statusCode === 500) {
    message = 'An unexpected internal server error occurred';
  }

  console.error(`[Error] ${req.method} ${req.path} → ${statusCode}: ${err.message}`);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  const payload = { error: message };
  if (isDev && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
