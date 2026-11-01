/**
 * Centralized Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Prisma unique constraint violation (MySQL / PostgreSQL / SQLite)
  if (err.code === 'P2002' || err.code === '23505' || err.code === 'ER_DUP_ENTRY') {
    const target = err.meta?.target ? ` on field: ${Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target}` : '';
    return res.status(409).json({
      error: `Conflict: A record with this unique identifier already exists${target}.`,
      detail: err.detail || err.message,
    });
  }

  // Prisma foreign key constraint violation
  if (err.code === 'P2003' || err.code === '23503' || err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      error: 'Bad Request: Referenced foreign key does not exist or record is referenced by other items.',
      detail: err.detail || err.message,
    });
  }

  // Prisma record to update/delete not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not Found: The requested database record does not exist or has already been removed.',
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
