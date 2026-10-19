const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  body: { type: String, required: [true, 'Comment text is required.'], trim: true, maxlength: 2000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
