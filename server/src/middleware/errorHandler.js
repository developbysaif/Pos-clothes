/**
 * Centralized Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Database unique constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Conflict: A record with this unique identifier already exists.',
      detail: err.detail,
    });
  }

  // Database foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Bad Request: Referenced foreign key does not exist.',
      detail: err.detail,
    });
  }

  // Zod / Validation error
  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: 'Validation Error',
      issues: err.errors,
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'An unexpected internal server error occurred.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
