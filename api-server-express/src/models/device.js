const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define(
    'devices',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      device_type: {
        type: DataTypes.ENUM('access_controller', 'face_reader', 'anpr'),
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true,
        validate: {
          len: [7, 45], // IPv4..IPv6 length guard
        },
      },
      status: {
        type: DataTypes.ENUM('inactive', 'active'),
        allowNull: false,
        defaultValue: 'inactive',
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE(6),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE(6),
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['device_type'] },
      ],
    }
  );

  return Device;
};
