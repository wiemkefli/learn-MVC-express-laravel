// src/services/deviceService.js
// Use built-in Node UUID to avoid ESM-only 'uuid' package issues
const { randomUUID } = require('crypto');
const { Device } = require('../models');
const { startProcess, stopProcess, isActive } = require('./processManager');

async function createDevice({ name, device_type, ip_address, metadata }) {
  return Device.create({
    id: randomUUID(),
    name,
    device_type,
    ip_address,
    status: 'inactive',
    metadata: metadata ?? null,
  });
}

async function listDevices() {
  const rows = await Device.findAll({ order: [['created_at', 'DESC']] });
  // Optionally compute liveActive derived from running workers
  return rows.map(d => ({
    ...d.toJSON(),
    live_active: isActive(d.id), // presence of worker at runtime
  }));
}

async function activateDevice(deviceId) {
  return startProcess(deviceId);
}

async function deactivateDevice(deviceId) {
  return stopProcess(deviceId);
}

module.exports = { createDevice, listDevices, activateDevice, deactivateDevice };
