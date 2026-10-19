const Comment = require('../models/CommentModel');
const BlogPost = require('../models/BlogPostModel');
const ErrorHandler = require('../utils/ErrorHandler');

function createCommentController({ commentModel = Comment, blogPostModel = BlogPost } = {}) {
  async function getComments(req, res, next) {
    try {
      const post = await blogPostModel.findById(req.params.postId);
      if (!post) return next(new ErrorHandler('Blog post not found.', 404));
      const comments = await commentModel.find({ post: req.params.postId })
        .sort({ createdAt: 1 })
        .populate('author', 'username');
      return res.status(200).json({ success: true, count: comments.length, comments });
    } catch (error) { return next(error); }
  }

  async function createComment(req, res, next) {
    try {
      const post = await blogPostModel.findById(req.params.postId);
      if (!post) return next(new ErrorHandler('Blog post not found.', 404));
      const comment = await commentModel.create({
        body: req.body?.body,
        author: req.user._id,
        post: post._id
      });
      await comment.populate('author', 'username');
      return res.status(201).json({ success: true, comment });
    } catch (error) { return next(error); }
  }

  return { getComments, createComment };
}

module.exports = { ...createCommentController(), createCommentController };
