const API_BASE = '/api';

function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchDemoUsers() {
  const res = await fetch(`${API_BASE}/demo-users`);
  if (!res.ok) throw new Error('Failed to fetch demo users');
  return res.json();
}

export async function registerOrganizationApi(payload) {
  const res = await fetch(`${API_BASE}/organizations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to register organization');
  return data;
}

export async function joinEmployeeApi(payload) {
  const res = await fetch(`${API_BASE}/employees/join`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join organization');
  return data;
}

export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function updatePreferredLanguage(token, preferredLanguage) {
  const res = await fetch(`${API_BASE}/auth/language`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ preferredLanguage })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update language');
  return data;
}

export async function fetchAnnouncements(token) {
  const res = await fetch(`${API_BASE}/announcements`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load announcements');
  return data;
}

export async function generateAIFormats(token, payload) {
  const res = await fetch(`${API_BASE}/ai/transform`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI generation failed');
  return data;
}

export async function createAnnouncementApi(token, payload) {
  const res = await fetch(`${API_BASE}/announcements`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create announcement');
  return data;
}

export async function updateAnnouncementApi(token, id, payload) {
  const res = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update announcement');
  return data;
}

export async function deleteAnnouncementApi(token, id) {
  const res = await fetch(`${API_BASE}/announcements/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete announcement');
  return data;
}

export async function submitAcknowledgementApi(token, payload) {
  const res = await fetch(`${API_BASE}/acknowledgements`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to acknowledge');
  return data;
}

export async function fetchAnalyticsApi(token) {
  const res = await fetch(`${API_BASE}/analytics`, {
    headers: getHeaders(token)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load analytics');
  return data;
}

export async function resetDemoDataApi() {
  const res = await fetch(`${API_BASE}/reset-demo`, {
    method: 'POST'
  });
  return res.json();
}
