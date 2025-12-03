const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeviceProcess = sequelize.define(
    'device_processes',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      device_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },
      pid: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      started_at: {
        type: DataTypes.DATE(6),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      last_heartbeat_at: {
        type: DataTypes.DATE(6),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      stopped_at: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
    },
    {
      timestamps: false,
      indexes: [
        { fields: ['device_id'] },
        { fields: ['device_id', 'stopped_at'] },
      ],
    }
  );

  return DeviceProcess;
};
