// api.js - small helper for backend calls
export const API_BASE = "http://127.0.0.1:8000";

export async function postForm(endpoint, formData) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    body: formData
  });
  return res.json();
}

export async function postJSON(endpoint, payload) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getJSON(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  return res.json();
}
