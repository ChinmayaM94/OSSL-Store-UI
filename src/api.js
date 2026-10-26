// Thin client for the ossl-store-pipeline REST API. Every call reports to `onLog` so the UI can
// show a request/error history; failures throw an ApiError carrying the server's error envelope.
const BASE = `${import.meta.env.VITE_API_BASE || ''}/api/stores`;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // 0 = network failure
  }
}

let onLog = () => {};
export const setLogger = (fn) => { onLog = fn; };

async function request(method, path, body) {
  const started = performance.now();
  const entry = { time: new Date(), method, path };
  try {
    let res;
    try {
      res = await fetch(BASE + path, { method, body });
    } catch (e) {
      throw new ApiError(`Network error: ${e.message}`, 0);
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
    entry.status = res.status;
    if (!res.ok) throw new ApiError((data && data.message) || text || res.statusText, res.status);
    return data;
  } catch (e) {
    entry.status ??= e.status;
    entry.message = e.message;
    throw e;
  } finally {
    entry.ms = Math.round(performance.now() - started);
    onLog(entry);
  }
}

const id = (storeId) => encodeURIComponent(storeId);

export const importCsv = (file) => {
  const form = new FormData();
  form.append('file', file);
  return request('POST', '/import', form);
};
export const publishStore = (storeId) => request('POST', `/${id(storeId)}/publish`);
export const getSql = (storeId) => request('GET', `/${id(storeId)}/sql`);
export const getMongo = (storeId) => request('GET', `/${id(storeId)}/mongo`);
export const getCache = (storeId) => request('GET', `/${id(storeId)}/cache`);
export const compareStore = (storeId) => request('GET', `/${id(storeId)}/compare`);
