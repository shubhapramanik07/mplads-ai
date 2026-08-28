/**
 * API Service for MPLADS AI Anomaly & Fraud Detection Engine.
 */
const API_BASE_URL = 'http://127.0.0.1:8001';

export async function fetchKPIs() {
  try {
    const res = await fetch(`${API_BASE_URL}/summary/kpis`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching KPIs:', err);
    return null;
  }
}

export async function fetchStateSummaries() {
  try {
    const res = await fetch(`${API_BASE_URL}/summary/state`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching states:', err);
    return [];
  }
}

export async function fetchMPSummaries(state = '') {
  try {
    const url = state ? `${API_BASE_URL}/summary/mp?state=${encodeURIComponent(state)}` : `${API_BASE_URL}/summary/mp`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching MPs:', err);
    return [];
  }
}

export async function fetchWorkTypes() {
  try {
    const res = await fetch(`${API_BASE_URL}/summary/work_types`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching work types:', err);
    return [];
  }
}

export async function fetchIDASummaries(state = '') {
  try {
    const url = state ? `${API_BASE_URL}/summary/ida?state=${encodeURIComponent(state)}` : `${API_BASE_URL}/summary/ida`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching IDA summaries:', err);
    return [];
  }
}

export async function fetchWorks(params = {}) {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE_URL}/works?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching works:', err);
    return { total: 0, data: [] };
  }
}

export async function fetchWorkById(workId) {
  try {
    const res = await fetch(`${API_BASE_URL}/works/${encodeURIComponent(workId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching work detail:', err);
    return null;
  }
}

export async function fetchAlerts(params = {}) {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE_URL}/alerts?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return { total_alerts: 0, alerts: [] };
  }
}

export async function fetchBenchmarks(mpName, state = '') {
  try {
    const query = new URLSearchParams({ mp_name: mpName });
    if (state) query.append('state', state);
    const res = await fetch(`${API_BASE_URL}/summary/benchmarks?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching benchmarks:', err);
    return null;
  }
}

export async function fetchValidationReport() {
  try {
    const res = await fetch(`${API_BASE_URL}/validation/report`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching validation report:', err);
    return null;
  }
}

export function formatINR(amount) {
  if (!amount && amount !== 0) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else {
    return `₹${num.toLocaleString('en-IN')}`;
  }
}
