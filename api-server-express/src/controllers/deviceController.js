// src/controllers/deviceController.js
const httpErrors = require('http-errors');
const { createDevice, listDevices, activateDevice, deactivateDevice } = require('../services/deviceService');

async function postCreateDevice(req, res, next) {
  try {
    const { name, device_type, ip_address, metadata } = req.body;
    if (!name || !device_type || !ip_address) throw httpErrors(400, 'name, device_type, ip_address are required');
    const device = await createDevice({ name, device_type, ip_address, metadata });
    res.status(201).json(device);
  } catch (e) { next(e); }
}

async function getListDevices(_req, res, next) {
  try {
    const devices = await listDevices();
    res.json(devices);
  } catch (e) { next(e); }
}

async function postActivateDevice(req, res, next) {
  try {
    const { id } = req.params;
    const result = await activateDevice(id);
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
}

async function postDeactivateDevice(req, res, next) {
  try {
    const { id } = req.params;
    const result = await deactivateDevice(id);
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
}

module.exports = {
  postCreateDevice,
  getListDevices,
  postActivateDevice,
  postDeactivateDevice,
};
