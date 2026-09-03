import { AppError } from './errors'

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('astra-access-token')
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    })
    if (!response.ok) {
      const code = response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : response.status === 404 ? 'NOT_FOUND' : response.status === 409 ? 'CONFLICT' : response.status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN_ERROR'
      throw new AppError(code, `Request failed (${response.status})`, response.status)
    }
    if (response.status === 204) return undefined as T
    return await response.json() as T
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('NETWORK_ERROR', 'Unable to reach ASTRA services.', undefined, error)
  }
}
