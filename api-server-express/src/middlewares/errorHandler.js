const logger = require('../utils/logger');

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    message: 'Resource not found',
    path: req.originalUrl,
  });
};

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
