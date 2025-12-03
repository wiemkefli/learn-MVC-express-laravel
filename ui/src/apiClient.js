const API_BASE = process.env.REACT_APP_API_BASE || '/api';

async function request(path, { method = 'GET', body } = {}) {
  const options = {
    method,
    headers: {},
  };

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) {
        message = data.error;
      }
    } catch (_) {
      // ignore parse errors
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getDevices() {
  return request('/devices');
}

export async function createDevice(payload) {
  return request('/devices', { method: 'POST', body: payload });
}

export async function activateDevice(id) {
  return request(`/devices/${id}/activate`, { method: 'POST' });
}

export async function deactivateDevice(id) {
  return request(`/devices/${id}/deactivate`, { method: 'POST' });
}

export async function getTransactions(limit = 10) {
  return request(`/transactions?limit=${limit}`);
}

export { API_BASE };
