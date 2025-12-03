const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define(
    'transactions',
    {
      transaction_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      device_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      event_type: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      timestamp: {
        // event time
        type: DataTypes.DATE(6),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE(6),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false, // table has created_at only; no updated_at
      indexes: [
        { fields: ['device_id', 'timestamp'] },
        { fields: ['timestamp'] },
        { fields: ['event_type'] },
      ],
    }
  );

  return Transaction;
};
