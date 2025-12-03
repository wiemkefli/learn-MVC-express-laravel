const path = require('path');
const dotenv = require('dotenv');

const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

if (process.env.UI_PORT && !process.env.PORT) {
  process.env.PORT = process.env.UI_PORT;
}

if (process.env.API_PORT && !process.env.REACT_APP_API_PORT) {
  process.env.REACT_APP_API_PORT = process.env.API_PORT;
}

if (process.env.UI_PORT && !process.env.REACT_APP_UI_PORT) {
  process.env.REACT_APP_UI_PORT = process.env.UI_PORT;
}

module.exports = () => {};
