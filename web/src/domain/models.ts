export type ModuleKey = 'dashboard' | 'jobs' | 'documents' | 'contacts' | 'inventory' | 'stock' | 'finance' | 'insights' | 'settings'
export type PrintJobStatus = 'Pending' | 'In Production' | 'Quality Check' | 'Completed' | 'Cancelled'
export type PrintMethod = 'Sublimation' | 'Silkscreen' | 'DTF' | 'Embroidery' | 'Heat Press' | 'Custom'

export interface PrintJob { id: string; title: string; customerId: string; customerName: string; method: PrintMethod; quantity: number; dueDate: string; status: PrintJobStatus }
export interface Contact { id: string; name: string; type: 'Customer' | 'Supplier'; phone: string; email: string }
export interface InventoryItem { id: string; sku: string; name: string; category: string; quantity: number; reorderLevel: number; unit: string }
export interface StockMovement { id: string; itemId: string; itemName: string; type: 'Receipt' | 'Consumption' | 'Adjustment'; quantity: number; balance: number; reference: string; date: string }
