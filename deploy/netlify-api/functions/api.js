#!/usr/bin/env node
'use strict';

/**
 * Netlify Function entry point for the Express capstone API.
 *
 * Netlify rewrites /api/* to /.netlify/functions/api/* before invoking this
 * handler, so the request path is normalised back to /api/* for Express.
 * The Express app and its Mongoose connection are reused across warm invocations.
 */

const serverless = require('serverless-http');

const LIB_PREFIX = '/.netlify/functions/api';
let handlerPromise = null;

async function createHandler() {
  const { connectDB } = require('../lib/config/db');
  const { createApp } = require('../lib/server');
  await connectDB();
  const app = createApp();
  return serverless(app);
}

function getHandler() {
  if (!handlerPromise) {
    handlerPromise = createHandler().catch((error) => {
      handlerPromise = null; // allow the next invocation to retry a cold connection
      throw error;
    });
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        status: 500,
        message: 'The API could not start: ' + (error && error.message ? error.message : 'unknown error')
      })
    };
  }
};
