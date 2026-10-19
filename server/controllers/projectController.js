const Project = require('../models/ProjectModel');
const ErrorHandler = require('../utils/ErrorHandler');

const editableFields = ['title', 'description', 'imageUrl', 'repoUrl', 'liveUrl'];

function createProjectController({ projectModel = Project } = {}) {
  async function getProjects(req, res, next) {
    try {
      const projects = await projectModel.find().sort({ createdAt: -1 }).populate('user', 'username');
      return res.status(200).json({ success: true, count: projects.length, projects });
    } catch (error) { return next(error); }
  }

  async function getProject(req, res, next) {
    try {
      const project = await projectModel.findById(req.params.id).populate('user', 'username');
      if (!project) return next(new ErrorHandler('Project not found.', 404));
      return res.status(200).json({ success: true, project });
    } catch (error) { return next(error); }
  }

  async function createProject(req, res, next) {
    try {
      const values = Object.fromEntries(editableFields
        .filter((field) => field in (req.body || {}))
        .map((field) => [field, req.body[field]]));
      const project = await projectModel.create({ ...values, user: req.user._id });
      return res.status(201).json({ success: true, project });
    } catch (error) { return next(error); }
  }

  async function updateProject(req, res, next) {
    try {
      const project = await projectModel.findById(req.params.id);
      if (!project) return next(new ErrorHandler('Project not found.', 404));
      for (const field of editableFields) {
        if (field in (req.body || {})) project[field] = req.body[field];
      }
      await project.save();
      return res.status(200).json({ success: true, project });
    } catch (error) { return next(error); }
  }

  async function deleteProject(req, res, next) {
    try {
      const project = await projectModel.findByIdAndDelete(req.params.id);
      if (!project) return next(new ErrorHandler('Project not found.', 404));
      return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
    } catch (error) { return next(error); }
  }

  return { getProjects, getProject, createProject, updateProject, deleteProject };
}

module.exports = { ...createProjectController(), createProjectController };
