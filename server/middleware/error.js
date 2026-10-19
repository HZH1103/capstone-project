/**
 * Convert application, request, and database errors to one JSON contract.
 * This middleware must be registered after every route and the 404 handler.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = Number(err.statusCode || err.status) || 500;
  let message = err.message || 'Internal server error.';
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((item) => item.message).join(' ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'The requested ID is not valid.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with this value already exists.';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    message = 'Request body contains invalid JSON.';
  }
  if (status >= 500 && process.env.NODE_ENV === 'production') message = 'Internal server error.';

  const payload = { success: false, status, message };
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;
  return res.status(status).json(payload);
}

module.exports = errorHandler;
