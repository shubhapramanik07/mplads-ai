/**
 * Comprehensive API Service for MPLADS AI Monitoring & Decision Support Platform.
 */
const API_BASE_URL = 'http://127.0.0.1:8001';

export async function fetchDashboardSummary(role = 'ministry', state = '', district = '', mpName = '') {
  try {
    const query = new URLSearchParams({ role });
    if (state && state !== 'All') query.append('state', state);
    if (district && district !== 'All') query.append('district', district);
    if (mpName && mpName !== 'All') query.append('mp_name', mpName);

    const res = await fetch(`${API_BASE_URL}/api/dashboard/summary?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    return null;
  }
}

export async function fetchProjects(params = {}) {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL' && v !== 'All') {
        query.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE_URL}/api/projects?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching projects:', err);
    return { total: 0, projects: [] };
  }
}

export async function fetchProjectDetail(projectId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching project detail:', err);
    return null;
  }
}

export async function fetchProjectRisk(projectId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/projects/${encodeURIComponent(projectId)}/risk`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching project risk:', err);
    return null;
  }
}

export async function fetchApiAlerts(params = {}) {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL' && v !== 'All') {
        query.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE_URL}/api/alerts?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return { total_alerts: 0, alerts: [] };
  }
}

export async function fetchStates() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/states`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching states:', err);
    return [];
  }
}

export async function fetchDistricts(state = '') {
  try {
    const url = state && state !== 'All' ? `${API_BASE_URL}/api/districts?state=${encodeURIComponent(state)}` : `${API_BASE_URL}/api/districts`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching districts:', err);
    return [];
  }
}

export async function fetchAnalytics(role = 'ministry', state = '', district = '', mpName = '') {
  try {
    const query = new URLSearchParams({ role });
    if (state && state !== 'All') query.append('state', state);
    if (district && district !== 'All') query.append('district', district);
    if (mpName && mpName !== 'All') query.append('mp_name', mpName);

    const res = await fetch(`${API_BASE_URL}/api/analytics?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return { work_type_distribution: [], risk_distribution: [], monthly_trend: [] };
  }
}

export async function fetchMapProjects(params = {}) {
  try {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL' && v !== 'All') {
        query.append(k, v);
      }
    });
    const res = await fetch(`${API_BASE_URL}/api/map/projects?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching map projects:', err);
    return { total_markers: 0, markers: [] };
  }
}

export async function fetchMPSummaries(state = '') {
  try {
    const url = state && state !== 'All' ? `${API_BASE_URL}/summary/mp?state=${encodeURIComponent(state)}` : `${API_BASE_URL}/summary/mp`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching MPs:', err);
    return [];
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
