const express = require('express');
const deviceRoutes = require('./deviceRoute');
const transactionRoutes = require('./transactionRoute');

const router = express.Router();

router.use('/devices', deviceRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;
