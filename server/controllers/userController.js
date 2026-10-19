const User = require('../models/UserModel');
const ErrorHandler = require('../utils/ErrorHandler');
const generateToken = require('../utils/generateToken');

function createUserController({ userModel = User, tokenGenerator = generateToken } = {}) {
  async function registerUser(req, res, next) {
    try {
      const { username, email, password } = req.body || {};
      if ([username, email, password].some((value) => typeof value !== 'string' || !value.trim())) {
        return next(new ErrorHandler('Username, email, and password are required.', 400));
      }
      if (password.trim().length < 6) {
        return next(new ErrorHandler('Password must be at least 6 characters long.', 400));
      }

      const user = await userModel.create({ username, email, password });
      return res.status(201).json({
        success: true,
        user: { _id: user._id, username: user.username, email: user.email, role: user.role }
      });
    } catch (error) {
      if (error.code === 11000) {
        return next(new ErrorHandler('A user with this username or email already exists.', 409));
      }
      return next(error);
    }
  }

  async function loginUser(req, res, next) {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
        return next(new ErrorHandler('Invalid email or password.', 401));
      }

      const user = await userModel.findOne({ email: email.trim().toLowerCase() }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return next(new ErrorHandler('Invalid email or password.', 401));
      }

      return res.status(200).json({
        success: true,
        user: { _id: user._id, username: user.username, email: user.email, role: user.role },
        token: tokenGenerator(user._id)
      });
    } catch (error) {
      return next(error);
    }
  }

  function getCurrentUser(req, res) {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role
      }
    });
  }

  return { registerUser, loginUser, getCurrentUser };
}

module.exports = { ...createUserController(), createUserController };
