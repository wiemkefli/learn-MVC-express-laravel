// src/routes/transactionRoutes.js
const express = require('express');
const { getTransactions } = require('../controllers/transactionController');

const router = express.Router();
router.get('/', getTransactions);  // GET /transactions?device_id=&event_type=&limit=100
module.exports = router;
