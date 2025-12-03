// src/services/processManager.js
const { Worker } = require('worker_threads');
const path = require('path');
const { randomUUID } = require('crypto');
const { sequelize, Device, DeviceProcess, DeviceStatusHistory } = require('../models');
const { createTransaction } = require('./transactionService');

const workersByDevice = new Map(); // device_id -> Worker

function isActive(deviceId) {
  return workersByDevice.has(deviceId);
}

async function startProcess(deviceId) {
  return sequelize.transaction(async (t) => {
    const device = await Device.findByPk(deviceId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!device) throw new Error('Device not found');

    if (isActive(deviceId)) {
      return { device, alreadyRunning: true };
    }

    // Create process row
    const proc = await DeviceProcess.create({
      id: randomUUID(),
      device_id: deviceId,
      pid: `worker-${Math.floor(Math.random()*1e5)}`
    }, { transaction: t });

    // Flip status + audit if needed
    if (device.status !== 'active') {
      await DeviceStatusHistory.create({
        id: randomUUID(),
        device_id: deviceId,
        old_status: device.status,
        new_status: 'active',
        reason: 'user_clicked_activate',
      }, { transaction: t });
      device.status = 'active';
      await device.save({ transaction: t });
    }

    // Start worker thread
    const worker = new Worker(path.join(__dirname, 'deviceWorker.js'), {
      workerData: { device_id: deviceId, device_type: device.device_type }
    });

    worker.on('message', async (msg) => {
      if (msg?.type === 'transaction') {
        try {
          const d = msg.data;
          await createTransaction({
            device_id: d.device_id,
            username: d.username,
            event_type: d.event_type,
            payload: d.payload,
            timestamp: new Date(d.timestamp),
          });
          // Heartbeat bump
          await DeviceProcess.update(
            { last_heartbeat_at: new Date() },
            { where: { device_id: deviceId, stopped_at: null } }
          );
        } catch (e) {
          console.error('Persist tx error:', e.message);
        }
      } else if (msg?.type === 'error') {
        console.error('Worker error:', msg.error);
      }
    });

    worker.on('exit', async () => {
      workersByDevice.delete(deviceId);
      // mark process stopped; if no other open process, set device inactive
      await sequelize.transaction(async (t2) => {
        await DeviceProcess.update(
          { stopped_at: new Date() },
          { where: { device_id: deviceId, stopped_at: null }, transaction: t2 }
        );
        const open = await DeviceProcess.findOne({ where: { device_id: deviceId, stopped_at: null }, transaction: t2 });
        if (!open) {
          const dev = await Device.findByPk(deviceId, { transaction: t2, lock: t2.LOCK.UPDATE });
          if (dev && dev.status !== 'inactive') {
            await DeviceStatusHistory.create({
              id: randomUUID(),
              device_id: deviceId,
              old_status: dev.status,
              new_status: 'inactive',
              reason: 'worker_exit',
            }, { transaction: t2 });
            dev.status = 'inactive';
            await dev.save({ transaction: t2 });
          }
        }
      });
    });

    workersByDevice.set(deviceId, worker);
    return { device, process: proc, alreadyRunning: false };
  });
}

async function markDeviceInactive(deviceId, reason) {
  return sequelize.transaction(async (t) => {
    await DeviceProcess.update(
      { stopped_at: new Date() },
      { where: { device_id: deviceId, stopped_at: null }, transaction: t }
    );

    const device = await Device.findByPk(deviceId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!device) return null;

    if (device.status !== 'inactive') {
      await DeviceStatusHistory.create({
        id: randomUUID(),
        device_id: deviceId,
        old_status: device.status,
        new_status: 'inactive',
        reason,
      }, { transaction: t });
      device.status = 'inactive';
      await device.save({ transaction: t });
    }

    return device;
  });
}

async function stopProcess(deviceId) {
  const worker = workersByDevice.get(deviceId);
  if (!worker) {
    await markDeviceInactive(deviceId, 'user_clicked_deactivate_no_worker');
    return { stopped: false, reason: 'not_running' };
  }

  worker.postMessage('stop');
  await markDeviceInactive(deviceId, 'user_clicked_deactivate');
  workersByDevice.delete(deviceId);
  return { stopped: true };
}

module.exports = { startProcess, stopProcess, isActive };
