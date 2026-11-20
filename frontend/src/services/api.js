const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

function csrfToken() {
  const cookie = document.cookie.split('; ').find(value => value.startsWith('XSRF-TOKEN='))
  return cookie ? decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) : ''
}

async function ensureCsrfToken() {
  if (csrfToken()) return
  const response = await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' })
  if (!response.ok) throw new Error('Cannot initialize CSRF protection.')
}

async function request(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) await ensureCsrfToken()
  const csrf = csrfToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(csrf && !['GET', 'HEAD', 'OPTIONS'].includes(method) ? { 'X-XSRF-TOKEN': csrf } : {}),
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(body?.message || 'Unable to connect to the server.')
    error.status = response.status
    error.code = body?.code
    error.details = body?.details
    throw error
  }

  return body
}

export function loginApi(credentials) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function logoutApi() {
  return request('/auth/logout', { method: 'POST' })
}

export function getCurrentUserApi() {
  return request('/auth/me')
}

export function api(path, options) {
  return request(path, options)
}

export async function pdfBlob(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Unable to load PDF document.')
  return response.blob()
}
