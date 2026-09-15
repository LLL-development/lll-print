import { useSyntheticStore } from '../../../context/useSyntheticStore'
import type { Contact } from '../../../domain/models'

interface CustomerPickerProps {
  selectedCustomerId: string | null
  onSelectCustomer: (customer: Contact | null) => void
  error?: string
}

export default function CustomerPicker({
  selectedCustomerId,
  onSelectCustomer,
  error,
}: CustomerPickerProps) {
  const { state } = useSyntheticStore()
  const customerContacts = state.contacts.filter((c) => c.type === 'Customer')
  const selected = customerContacts.find((c) => c.id === selectedCustomerId) || null

  return (
    <div className="customer-picker-field">
      <label htmlFor="quotation-customer-select">
        Customer <span className="required-star">*</span>
      </label>
      <select
        id="quotation-customer-select"
        value={selectedCustomerId || ''}
        onChange={(e) => {
          const val = e.target.value
          const found = customerContacts.find((c) => c.id === val) || null
          onSelectCustomer(found)
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'customer-picker-error' : undefined}
      >
        <option value="">-- Select a customer --</option>
        {customerContacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.phone})
          </option>
        ))}
      </select>
      {error && (
        <span id="customer-picker-error" className="field-error-text" role="alert">
          {error}
        </span>
      )}
      {selected && (
        <div className="customer-preview-box">
          <div className="customer-preview-avatar" aria-hidden="true">
            {selected.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="customer-preview-info">
            <div className="customer-preview-title-row">
              <span className="customer-preview-name">{selected.name}</span>
              <span className="customer-preview-pill">{selected.id}</span>
              <span className="customer-preview-pill customer-type-pill">Customer</span>
            </div>
            <div className="customer-preview-channels">
              <span>📞 {selected.phone}</span>
              <span className="channel-sep">·</span>
              <span>✉ {selected.email}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
