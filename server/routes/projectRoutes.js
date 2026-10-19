const express = require('express');
const { createProtect, requireAdmin } = require('../middleware/auth');
const { createProjectController } = require('../controllers/projectController');

function createProjectRouter({ projectModel, userModel } = {}) {
  const router = express.Router();
  const controller = createProjectController({ projectModel });
  const protect = createProtect({ userModel });

  router.route('/')
    .get(controller.getProjects)
    .post(protect, requireAdmin, controller.createProject);
  router.route('/:id')
    .get(controller.getProject)
    .put(protect, requireAdmin, controller.updateProject)
    .delete(protect, requireAdmin, controller.deleteProject);

  return router;
}

module.exports = { createProjectRouter };
