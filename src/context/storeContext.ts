import { createContext } from 'react'
import type { SyntheticStoreContextValue } from './types'

export const SyntheticStoreContext = createContext<SyntheticStoreContextValue | null>(null)
