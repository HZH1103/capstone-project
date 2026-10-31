const express = require('express');
const rateLimit = require('express-rate-limit');
const { createContactController } = require('../controllers/contactController');

function createContactRouter({ messageModel } = {}) {
  const router = express.Router();
  const controller = createContactController({ messageModel });
  const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, status: 429, message: 'Too many messages. Please try again later.' }
  });

  router.post('/', contactLimiter, controller.createMessage);
  return router;
}

module.exports = { createContactRouter };
