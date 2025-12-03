// src/routes/deviceRoutes.js
const express = require('express');
const { postCreateDevice, getListDevices, postActivateDevice, postDeactivateDevice } = require('../controllers/deviceController');

const router = express.Router();

router.get('/', getListDevices);                 // GET /devices
router.post('/', postCreateDevice);              // POST /devices
router.post('/:id/activate', postActivateDevice);// POST /devices/:id/activate
router.post('/:id/deactivate', postDeactivateDevice); // POST /devices/:id/deactivate

module.exports = router;
