const app = require('./app');
const { sequelize } = require('./models');
const { ensureDatabase } = require('./db');
const logger = require('./utils/logger');

const PORT = Number(process.env.API_PORT || process.env.PORT || 3000);

async function bootstrap() {
  try {
    await ensureDatabase();
    await sequelize.authenticate();
    logger.info('Connected to MySQL');
    await sequelize.sync();
    logger.info('Database synced');
  } catch (error) {
    logger.error('Database connection failed', error.message);
  }

  app.listen(PORT, () => {
    logger.info(`API server listening on port ${PORT}`);
  });
}

bootstrap();
