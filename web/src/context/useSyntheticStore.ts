import { useContext } from 'react'
import { SyntheticStoreContext } from './storeContext'
import type { SyntheticStoreContextValue } from './types'

export function useSyntheticStore(): SyntheticStoreContextValue {
  const context = useContext(SyntheticStoreContext)
  if (!context) {
    throw new Error('useSyntheticStore must be used within a SyntheticStoreProvider')
  }
  return context
}

export type { SyntheticStoreContextValue }
