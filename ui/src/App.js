import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activateDevice,
  createDevice,
  deactivateDevice,
  getDevices,
  getTransactions,
} from './apiClient';
import './App.css';

const DEVICE_TYPES = [
  { label: 'Access Controller', value: 'access_controller' },
  { label: 'Face Recognition Reader', value: 'face_reader' },
  { label: 'ANPR', value: 'anpr' },
];

const initialFormState = {
  name: '',
  device_type: DEVICE_TYPES[0].value,
  ip_address: '',
};

const DEVICES_PAGE_SIZE = 5;

function App() {
  const [devices, setDevices] = useState([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialFormState);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [savingDevice, setSavingDevice] = useState(false);
  const [error, setError] = useState('');
  const [txError, setTxError] = useState('');

  const fetchDevices = useCallback(async (pageToLoad = 1) => {
    setLoadingDevices(true);
    setError('');
    const targetPage = pageToLoad ?? 1;
    try {
      const { items, meta } = await getDevices({ page: targetPage, pageSize: DEVICES_PAGE_SIZE });
      setDevices(items);
      const total = meta?.total ?? items.length;
      setTotalDevices(total);
      const nextPage = meta?.page ?? targetPage;
      setPage((current) => (current === nextPage ? current : nextPage));
    } catch (err) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    setTxError('');
    try {
      const data = await getTransactions(10);
      setTransactions(data);
    } catch (err) {
      setTxError(err.message || 'Failed to load transactions');
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(page);
  }, [fetchDevices, page]);

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 3000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.ip_address) {
      setError('Name and IP address are required.');
      return;
    }
    setSavingDevice(true);
    setError('');
    try {
      await createDevice(form);
      setForm(initialFormState);
      if (page !== 1) {
        setPage(1);
      } else {
        await fetchDevices(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to create device');
    } finally {
      setSavingDevice(false);
    }
  };

  const handleToggle = async (deviceId, action) => {
    try {
      if (action === 'activate') {
        await activateDevice(deviceId);
      } else {
        await deactivateDevice(deviceId);
      }
      await fetchDevices(page);
    } catch (err) {
      setError(err.message || 'Failed to update device');
    }
  };

  const statusClasses = useMemo(
    () => ({
      active: 'status-badge status-active',
      inactive: 'status-badge status-inactive',
    }),
    []
  );

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalDevices / DEVICES_PAGE_SIZE) || 1),
    [totalDevices]
  );
  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Device Simulator</h1>
          <p className="subtitle">
            Manage devices and monitor recent transactions from the worker threads.
          </p>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Add Device</h2>
          <form className="device-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Gate A"
                required
              />
            </label>
            <label>
              Device Type
              <select
                name="device_type"
                value={form.device_type}
                onChange={handleInputChange}
              >
                {DEVICE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              IP Address
              <input
                type="text"
                name="ip_address"
                value={form.ip_address}
                onChange={handleInputChange}
                placeholder="10.0.0.10"
                required
              />
            </label>
            <button type="submit" disabled={savingDevice}>
              {savingDevice ? 'Saving...' : 'Create Device'}
            </button>
            {error && <p className="error-text">{error}</p>}
          </form>
        </section>

        <section className="card wide">
          <div className="section-header">
            <h2>Devices</h2>
            <button className="ghost-btn" onClick={() => fetchDevices(page)} disabled={loadingDevices}>
              {loadingDevices ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div className="table-wrapper">
            <table className="devices-table">
              <colgroup>
                <col style={{ width: '26%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>IP</th>
                  <th>Status</th>
                  <th>Live</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty">
                      No devices found.
                    </td>
                  </tr>
                )}
                {devices.map((device) => (
                  <tr key={device.id}>
                    <td>
                      <div className="cell-main">{device.name}</div>
                      <div className="cell-sub">{new Date(device.created_at).toLocaleString()}</div>
                    </td>
                    <td>{device.device_type.replace('_', ' ')}</td>
                    <td>{device.ip_address}</td>
                    <td>
                      <span className={statusClasses[device.status] || 'status-badge'}>
                        {device.status}
                      </span>
                    </td>
                    <td>
                      <span className={device.live_active ? 'live-dot live' : 'live-dot'}>
                        {device.live_active ? 'Active' : 'Idle'}
                      </span>
                    </td>
                    <td>
                      {device.status === 'active' ? (
                        <button
                          className="secondary"
                          onClick={() => handleToggle(device.id, 'deactivate')}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => handleToggle(device.id, 'activate')}>Activate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button
              className="ghost-btn"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!canPrev || loadingDevices}
            >
              Prev
            </button>
            <span className="page-info">
              Page {page} of {pageCount}
            </span>
            <button
              className="ghost-btn"
              onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              disabled={!canNext || loadingDevices}
            >
              Next
            </button>
          </div>
        </section>

        <section className="card wide">
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <span className="hint">Auto-refreshing every 3s</span>
          </div>
          {txError && <p className="error-text">{txError}</p>}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Device</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">
                      {loadingTransactions ? 'Loading...' : 'No transactions yet.'}
                    </td>
                  </tr>
                )}
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td>{new Date(tx.timestamp || tx.created_at).toLocaleString()}</td>
                    <td>{tx.device_id}</td>
                    <td>{tx.username || '—'}</td>
                    <td>{tx.event_type}</td>
                    <td>
                      <code className="payload">
                        {tx.payload ? JSON.stringify(tx.payload) : '—'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
