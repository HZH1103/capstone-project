const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const ErrorHandler = require('../utils/ErrorHandler');

function createProtect({ userModel = User } = {}) {
  return async function protect(req, res, next) {
    const authorization = req.get('authorization') || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return next(new ErrorHandler('Authentication required.', 401));

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret || secret.length < 32) {
        return next(new ErrorHandler('Authentication service is not configured.', 503));
      }
      const payload = jwt.verify(match[1], secret);
      const user = await userModel.findById(payload.id);
      if (!user) return next(new ErrorHandler('Authentication required.', 401));
      req.user = user;
      return next();
    } catch {
      return next(new ErrorHandler('Authentication required.', 401));
    }
  };
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new ErrorHandler('Administrator access is required.', 403));
  }
  return next();
}

module.exports = { createProtect, protect: createProtect(), requireAdmin };
