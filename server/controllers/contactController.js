const Message = require('../models/MessageModel');

function createContactController({ messageModel = Message } = {}) {
  async function createMessage(req, res, next) {
    try {
      const { name, email, message } = req.body || {};
      const saved = await messageModel.create({ name, email, message });
      return res.status(201).json({
        success: true,
        message: 'Thanks for reaching out. Your message has been received.',
        id: saved._id
      });
    } catch (error) { return next(error); }
  }

  return { createMessage };
}

module.exports = { ...createContactController(), createContactController };
