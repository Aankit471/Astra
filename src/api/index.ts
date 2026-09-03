import type { AstraApi } from './types'
import { mockApi } from './mockAdapter'
import { httpApi } from './httpAdapter'

export const api: AstraApi = import.meta.env.VITE_USE_MOCK_API !== 'false' ? mockApi : httpApi

export * from './client'
export * from './errors'
export type * from './types'
