#!/usr/bin/env node
'use strict';

/**
 * Netlify Function entry point for the Express capstone API.
 *
 * Netlify rewrites /api/* to /.netlify/functions/api/* before invoking this
 * handler, so the request path is normalised back to /api/* for Express.
 *
 * The Express app is reused across warm invocations. MongoDB Atlas closes idle
 * connections, so before serving each invocation we make sure Mongoose is
 * connected again; otherwise the API's database-ready guard would answer 503
 * until the platform happened to recycle the instance.
 */

const serverless = require('serverless-http');

const LIB_PREFIX = '/.netlify/functions/api';
let handlerPromise = null;

async function ensureConnected() {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState === 1) return;

  const { connectDB } = require('../lib/config/db');
  if (mongoose.connection.readyState === 2) {
    // A connection attempt is already in flight - wait for it, then retry once.
    try {
      await mongoose.connection.asPromise();
    } catch (error) {
      // fall through to a fresh connectDB() attempt below
    }
    if (mongoose.connection.readyState === 1) return;
  }
  await connectDB();
}

async function getHandler() {
  await ensureConnected();
  if (!handlerPromise) {
    const { createApp } = require('../lib/server');
    const app = createApp();
    handlerPromise = Promise.resolve(serverless(app));
  }
  return handlerPromise;
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const handler = await getHandler();
    const normalized = { ...event };
    if (typeof event.path === 'string' && event.path.startsWith(LIB_PREFIX)) {
      const rest = event.path.slice(LIB_PREFIX.length) || '/';
      normalized.path = '/api' + (rest.startsWith('/') ? rest : '/' + rest);
    }
    return await handler(normalized, context);
  } catch (error) {
    // Drop the cached handler so the next invocation starts from a clean state.
    handlerPromise = null;
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        status: 503,
        message: 'The API is temporarily unavailable: ' + (error && error.message ? error.message : 'unknown error')
      })
    };
  }
};
