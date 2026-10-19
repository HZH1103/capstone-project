/**
 * Error with an HTTP status code for the centralized Express handler.
 */
class ErrorHandler extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ErrorHandler';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler;
