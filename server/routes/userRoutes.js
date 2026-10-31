const express = require('express');
const rateLimit = require('express-rate-limit');
const { createProtect } = require('../middleware/auth');
const { createUserController } = require('../controllers/userController');

function createUserRouter({ userModel, tokenGenerator } = {}) {
  const router = express.Router();
  const controller = createUserController({ userModel, tokenGenerator });
  const protect = createProtect({ userModel });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    // Generous enough for a person testing the deployed demo, tight enough to
    // make credential stuffing impractical.
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, status: 429, message: 'Too many authentication attempts. Please try again later.' }
  });

  router.post('/register', authLimiter, controller.registerUser);
  router.post('/login', authLimiter, controller.loginUser);
  router.get('/me', protect, controller.getCurrentUser);
  return router;
}

module.exports = { createUserRouter };
