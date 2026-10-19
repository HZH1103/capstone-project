const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required.'], trim: true, maxlength: 100 },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.']
  },
  message: { type: String, required: [true, 'Message is required.'], trim: true, minlength: 10, maxlength: 5000 }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
