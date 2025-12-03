const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DeviceStatusHistory = sequelize.define(
    'device_status_history',
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
      old_status: {
        type: DataTypes.ENUM('inactive', 'active'),
        allowNull: false,
      },
      new_status: {
        type: DataTypes.ENUM('inactive', 'active'),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      changed_at: {
        type: DataTypes.DATE(6),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      indexes: [
        { fields: ['device_id', 'changed_at'] },
      ],
    }
  );

  return DeviceStatusHistory;
};
