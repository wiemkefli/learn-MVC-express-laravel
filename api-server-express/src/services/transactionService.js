// src/services/transactionService.js
const { randomUUID } = require('crypto');
const { Transaction } = require('../models');

async function createTransaction({ device_id, username, event_type, payload, timestamp = new Date() }) {
  return Transaction.create({
    transaction_id: randomUUID(),
    device_id,
    username: username ?? null,
    event_type,
    timestamp,
    payload: payload ?? null,
    created_at: new Date(),
  });
}

async function listTransactions({ limit = 100, device_id, event_type } = {}) {
  const where = {};
  if (device_id) where.device_id = device_id;
  if (event_type) where.event_type = event_type;

  return Transaction.findAll({
    where,
    order: [['timestamp', 'DESC']],
    limit,
  });
}

module.exports = { createTransaction, listTransactions };
