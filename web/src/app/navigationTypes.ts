/**
 * Primary navigation destinations specified in SDD §5 and SPMP T2 Brief.
 */
export type PrimaryDestination = 'overview' | 'quotations' | 'jobs' | 'billing' | 'more'

/**
 * Supporting modules accessible under the /more destination.
 */
export type MoreSubModule = 'contacts' | 'inventory' | 'stock' | 'finance' | 'insights' | 'settings'

/**
 * Strictly display-only role label used for visual distinction in v1 (SRS FR-10).
 * Does NOT represent authentication, secure identity, or server authorization.
 */
export type DisplayRole = 'Admin' | 'Staff'

export interface NavigationItem {
  key: PrimaryDestination
  label: string
  path: string
  icon: string
}
