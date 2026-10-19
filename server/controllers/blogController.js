const BlogPost = require('../models/BlogPostModel');
const Comment = require('../models/CommentModel');
const ErrorHandler = require('../utils/ErrorHandler');

function idOf(value) {
  return String(value?._id || value);
}

function createBlogController({ blogPostModel = BlogPost, commentModel = Comment } = {}) {
  async function getPosts(req, res, next) {
    try {
      const posts = await blogPostModel.find().sort({ createdAt: -1 }).populate('author', 'username');
      return res.status(200).json({ success: true, count: posts.length, posts });
    } catch (error) { return next(error); }
  }

  async function getPost(req, res, next) {
    try {
      const post = await blogPostModel.findById(req.params.id)
        .populate('author', 'username')
        .populate({ path: 'comments', populate: { path: 'author', select: 'username' } });
      if (!post) return next(new ErrorHandler('Blog post not found.', 404));
      return res.status(200).json({ success: true, post });
    } catch (error) { return next(error); }
  }

  async function createPost(req, res, next) {
    try {
      const post = await blogPostModel.create({
        title: req.body?.title,
        content: req.body?.content,
        author: req.user._id
      });
      await post.populate('author', 'username');
      return res.status(201).json({ success: true, post });
    } catch (error) { return next(error); }
  }

  async function updatePost(req, res, next) {
    try {
      const post = await blogPostModel.findById(req.params.id);
      if (!post) return next(new ErrorHandler('Blog post not found.', 404));
      if (idOf(post.author) !== idOf(req.user)) {
        return next(new ErrorHandler('Only the original author can update this post.', 403));
      }
      if ('title' in (req.body || {})) post.title = req.body.title;
      if ('content' in (req.body || {})) post.content = req.body.content;
      await post.save();
      await post.populate('author', 'username');
      return res.status(200).json({ success: true, post });
    } catch (error) { return next(error); }
  }

  async function deletePost(req, res, next) {
    try {
      const post = await blogPostModel.findById(req.params.id);
      if (!post) return next(new ErrorHandler('Blog post not found.', 404));
      if (idOf(post.author) !== idOf(req.user)) {
        return next(new ErrorHandler('Only the original author can delete this post.', 403));
      }
      await blogPostModel.findByIdAndDelete(req.params.id);
      await commentModel.deleteMany({ post: req.params.id });
      return res.status(200).json({ success: true, message: 'Blog post deleted successfully.' });
    } catch (error) { return next(error); }
  }

  return { getPosts, getPost, createPost, updatePost, deletePost };
}

module.exports = { ...createBlogController(), createBlogController };
