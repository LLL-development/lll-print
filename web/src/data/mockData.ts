import type { Contact, InventoryItem, PrintJob, StockMovement } from '../domain/models'

export const jobs: PrintJob[] = [
  { id: 'J-1048', title: 'Corporate polo launch', customerId: 'C-01', customerName: 'Meridian Studio', method: 'Sublimation', quantity: 120, dueDate: '2026-08-29', status: 'Pending' },
  { id: 'J-1047', title: 'Tournament jerseys', customerId: 'C-02', customerName: 'Northstar FC', method: 'DTF', quantity: 48, dueDate: '2026-08-28', status: 'In Production' },
  { id: 'J-1046', title: 'Crew uniform refresh', customerId: 'C-03', customerName: 'Cedar & Co.', method: 'Embroidery', quantity: 32, dueDate: '2026-09-02', status: 'Quality Check' },
  { id: 'J-1045', title: 'Volunteer event shirts', customerId: 'C-04', customerName: 'Bina Community', method: 'Silkscreen', quantity: 180, dueDate: '2026-08-25', status: 'Completed' },
]

export const customers: Contact[] = [
  { id: 'C-01', name: 'Meridian Studio', type: 'Customer', phone: '+60 12-345 7810', email: 'orders@meridian.example' },
  { id: 'C-02', name: 'Northstar FC', type: 'Customer', phone: '+60 17-882 1940', email: 'team@northstar.example' },
  { id: 'S-01', name: 'Textile Source MY', type: 'Supplier', phone: '+60 11-408 2270', email: 'sales@textilesource.example' },
]

export const inventory: InventoryItem[] = [
  { id: 'I-01', sku: 'TS-DRY-BLK-M', name: 'Black dry-fit shirt · M', category: 'Garment', quantity: 86, reorderLevel: 30, unit: 'pcs' },
  { id: 'I-02', sku: 'INK-DTF-BLK', name: 'DTF ink · Black', category: 'Ink', quantity: 1.2, reorderLevel: 2, unit: 'L' },
  { id: 'I-03', sku: 'FILM-DTF-A3', name: 'DTF transfer film · A3', category: 'Film', quantity: 240, reorderLevel: 100, unit: 'sheets' },
]

export const movements: StockMovement[] = [
  { id: 'M-04', itemId: 'I-02', itemName: 'DTF ink · Black', type: 'Consumption', quantity: -0.3, balance: 1.2, reference: 'J-1047', date: '2026-08-27' },
  { id: 'M-03', itemId: 'I-01', itemName: 'Black dry-fit shirt · M', type: 'Consumption', quantity: -24, balance: 86, reference: 'J-1047', date: '2026-08-27' },
  { id: 'M-02', itemId: 'I-03', itemName: 'DTF transfer film · A3', type: 'Receipt', quantity: 200, balance: 240, reference: 'PO-0832', date: '2026-08-26' },
  { id: 'M-01', itemId: 'I-01', itemName: 'Black dry-fit shirt · M', type: 'Receipt', quantity: 100, balance: 110, reference: 'PO-0828', date: '2026-08-24' },
]
