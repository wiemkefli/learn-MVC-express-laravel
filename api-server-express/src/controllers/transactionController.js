// src/controllers/transactionController.js
const { listTransactions } = require('../services/transactionService');

async function getTransactions(req, res, next) {
  try {
    const { limit, device_id, event_type } = req.query;
    const rows = await listTransactions({
      limit: limit ? Number(limit) : 100,
      device_id,
      event_type,
    });
    res.json(rows);
  } catch (e) { next(e); }
}

module.exports = { getTransactions };
