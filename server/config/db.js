const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas through Mongoose.
 * The URI is intentionally read from the local .env file at runtime.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env and configure Atlas.');
  }

  const connection = await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'capstone_portfolio',
    serverSelectionTimeoutMS: 10000
  });
  return connection.connection;
}

/** Close the active client cleanly when the process stops. */
async function closeDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

module.exports = { connectDB, closeDB };
