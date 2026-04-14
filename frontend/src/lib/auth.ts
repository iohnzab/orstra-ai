import { AuthResponse } from './types'

const TOKEN_KEY = 'orstra_token'
const USER_KEY = 'orstra_user'

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.access_token)
  localStorage.setItem(USER_KEY, JSON.stringify({ id: auth.user_id, email: auth.email }))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
