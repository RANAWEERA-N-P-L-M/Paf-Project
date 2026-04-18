import authService from '../services/authService'

const decodeTokenPayload = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return {}
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    )
    return JSON.parse(json)
  } catch {
    return {}
  }
}

function useCurrentUser() {
  const token = authService.getToken()
  if (!token) return { email: '', id: '', name: '' }

  const payload = decodeTokenPayload(token)
  return {
    email: payload.email || payload.sub || '',
    id: payload.userId || payload.id || '',
    name: payload.name || '',
  }
}

export default useCurrentUser
