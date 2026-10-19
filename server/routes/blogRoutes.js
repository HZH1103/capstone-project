const express = require('express');
const { createProtect } = require('../middleware/auth');
const { createBlogController } = require('../controllers/blogController');
const { createCommentController } = require('../controllers/commentController');

function createBlogRouter({ blogPostModel, commentModel, userModel } = {}) {
  const router = express.Router();
  const posts = createBlogController({ blogPostModel, commentModel });
  const comments = createCommentController({ blogPostModel, commentModel });
  const protect = createProtect({ userModel });

  router.get('/', posts.getPosts);
  router.get('/:postId/comments', comments.getComments);
  router.post('/:postId/comments', protect, comments.createComment);
  router.get('/:id', posts.getPost);
  router.post('/', protect, posts.createPost);
  router.put('/:id', protect, posts.updatePost);
  router.delete('/:id', protect, posts.deletePost);
  return router;
}

module.exports = { createBlogRouter };
