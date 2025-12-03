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

export async function getDevices(params = {}) {
  const { page, pageSize } = params;

  const query = [];
  if (page !== undefined && page !== null) query.push(`page=${page}`);
  if (pageSize !== undefined && pageSize !== null) query.push(`pageSize=${pageSize}`);
  const queryString = query.length ? `?${query.join('&')}` : '';

  const data = await request(`/devices${queryString}`);

  if (Array.isArray(data)) {
    const size = pageSize ?? data.length;
    const currentPage = page ?? 1;
    const start = (currentPage - 1) * size;
    const items = data.slice(start, start + size);
    return {
      items,
      meta: { page: currentPage, pageSize: size, total: data.length },
    };
  }

  const items = data?.items ?? [];
  const meta = data?.meta ?? {
    page: page ?? 1,
    pageSize: pageSize ?? items.length,
    total: data?.total ?? items.length,
  };

  return { items, meta };
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
