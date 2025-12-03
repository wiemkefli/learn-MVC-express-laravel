const { sequelize } = require('../db');

const Device = require('./device')(sequelize);
const Transaction = require('./transaction')(sequelize);
const DeviceProcess = require('./deviceProcess')(sequelize);
const DeviceStatusHistory = require('./deviceStatusHistory')(sequelize);

module.exports = {
  sequelize,
  Device,
  Transaction,
  DeviceProcess,
  DeviceStatusHistory,
};
