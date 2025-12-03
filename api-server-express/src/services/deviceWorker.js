// src/services/deviceWorker.js
// Runs inside worker_threads: DO NOT import Sequelize here.
// It only generates events and sends them to the parent.

const { parentPort, workerData } = require('worker_threads');

const USERS = ['alice', 'bob', 'charlie', 'system'];
const EVENTS = {
  access_controller: ['access_granted', 'access_denied'],
  face_reader: ['face_match', 'face_no_match'],
  anpr: ['plate_read', 'plate_mismatch']
};

function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDelay(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

let running = true;

async function loop() {
  const { device_id, device_type } = workerData;
  while (running) {
    // Random wait 1s–4s
    const wait = randomDelay(1000, 4000);
    await new Promise(r => setTimeout(r, wait));

    const username = randomOf(USERS);
    const event_type = randomOf(EVENTS[device_type] || ['event']);
    const payload = buildPayload(device_type);

    parentPort.postMessage({
      type: 'transaction',
      data: {
        device_id,
        username,
        event_type,
        payload,
        timestamp: new Date().toISOString(),
      }
    });
  }
}

function buildPayload(kind) {
  switch (kind) {
    case 'access_controller':
      return { door_id: 'A1', method: randomOf(['card','pin','mobile']), ok: Math.random() > 0.2 };
    case 'face_reader':
      return { face_id: `F-${Math.floor(Math.random()*10000)}`, match_score: +(0.7 + Math.random()*0.3).toFixed(2) };
    case 'anpr':
      return { plate: randomPlate(), confidence: +(0.8 + Math.random()*0.2).toFixed(2), lane: randomOf(['INBOUND','OUTBOUND']) };
    default:
      return { note: 'generic_event' };
  }
}

function randomPlate() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = () => letters[Math.floor(Math.random()*letters.length)];
  return `${L()}${L()}${L()}${Math.floor(Math.random()*9000+1000)}`;
}

parentPort.on('message', (msg) => {
  if (msg === 'stop') running = false;
});

loop().catch(err => {
  parentPort.postMessage({ type: 'error', error: err.message });
});
