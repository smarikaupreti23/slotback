// Thin client for the SlotBack FastAPI backend.
// The only configuration is the (public) backend URL. No Supabase keys exist in the frontend.

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const TOKEN_KEY = 'slotback_token'
const USER_KEY  = 'slotback_user'

export function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function getUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function saveSession({ access_token, user }) {
  sessionStorage.setItem(TOKEN_KEY, access_token)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem('cancellationId')
}

// Turns FastAPI error payloads (string or validation list) into one readable message.
function errorMessage(data, status) {
  const detail = data && data.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0]
    const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : ''
    return field ? `${field}: ${first.msg}` : first.msg
  }
  return `Request failed (${status})`
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Cannot reach the server. Please try again.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) {
      clearSession()
      window.location.assign('/login')
    }
    throw new Error(errorMessage(data, res.status))
  }
  return data
}

export const api = {
  login:    (email, password)            => request('/auth/login',    { method: 'POST', body: { email, password } }),
  register: (full_name, email, password) => request('/auth/register', { method: 'POST', body: { full_name, email, password } }),

  getConfig:   () => request('/config'),
  getWaitlist: () => request('/waitlist'),
  addPatient:  (patient) => request('/waitlist', { method: 'POST', body: patient }),

  createCancellation: (data) => request('/cancellations', { method: 'POST', body: data }),
  getCancellation:    (id)   => request(`/cancellations/${id}`),
  sendOffers:         (id)   => request(`/cancellations/${id}/offers`, { method: 'POST' }),
  acceptFirstOffer:   (id)   => request(`/cancellations/${id}/accept`, { method: 'POST' }),
  getSummary:         (id)   => request(`/cancellations/${id}/summary`),
}
