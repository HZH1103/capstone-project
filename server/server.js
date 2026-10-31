require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB, closeDB } = require('./config/db');
const { createUserRouter } = require('./routes/userRoutes');
const { createProjectRouter } = require('./routes/projectRoutes');
const { createBlogRouter } = require('./routes/blogRoutes');
const { createContactRouter } = require('./routes/contactRoutes');
const ErrorHandler = require('./utils/ErrorHandler');
const errorHandler = require('./middleware/error');

function createApp({
  userModel,
  projectModel,
  blogPostModel,
  commentModel,
  messageModel,
  isDatabaseReady = () => mongoose.connection.readyState === 1
} = {}) {
  const app = express();
  const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',').map((origin) => origin.trim()).filter(Boolean);

  // Render (and virtually every cloud platform) terminates TLS in front of the
  // process and forwards the visitor address in X-Forwarded-For. Express must be
  // told how many proxy hops to trust so req.ip is the real client address;
  // without this, every visitor shares the proxy's IP and therefore one
  // rate-limit bucket, which lets one tester lock out login for everyone.
  // TRUST_PROXY overrides the default of a single proxy hop when needed.
  const trustProxy = process.env.TRUST_PROXY;
  app.set('trust proxy', trustProxy
    ? (Number.isNaN(Number(trustProxy)) ? trustProxy : Number(trustProxy))
    : 1);

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new ErrorHandler('This origin is not allowed by the API.', 403));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    const ready = isDatabaseReady();
    return res.status(ready ? 200 : 503).json({
      success: ready,
      service: 'portfolio-blog-api',
      database: ready ? 'connected' : 'disconnected'
    });
  });

  app.use('/api', (req, res, next) => {
    if (!isDatabaseReady()) return next(new ErrorHandler('Database is not available.', 503));
    return next();
  });
  app.use('/api/users', createUserRouter({ userModel }));
  app.use('/api/projects', createProjectRouter({ projectModel, userModel }));
  app.use('/api/blog', createBlogRouter({ blogPostModel, commentModel, userModel }));
  app.use('/api/contact', createContactRouter({ messageModel }));

  app.use((req, res, next) => {
    next(new ErrorHandler(`Route ${req.method} ${req.originalUrl} was not found.`, 404));
  });
  app.use(errorHandler);
  return app;
}

async function startServer() {
  const port = Number(process.env.PORT) || 5000;
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  await connectDB();
  const app = createApp();
  const server = app.listen(port, () => console.log(`Portfolio API listening on port ${port}.`));

  const shutdown = async () => {
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`API startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { createApp, startServer };
