// src/app.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });
const express = require('express');
const morgan = require('morgan');
const apiRoutes = require('./routes');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiRoutes);

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
