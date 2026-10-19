const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Project title is required.'], trim: true, maxlength: 120 },
  description: { type: String, required: [true, 'Project description is required.'], trim: true, maxlength: 2000 },
  imageUrl: { type: String, trim: true, default: '' },
  repoUrl: { type: String, trim: true, default: '' },
  liveUrl: { type: String, trim: true, default: '' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
