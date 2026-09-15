import { formatMYR } from '../../../lib/formatters'
import type { DraftLine, Money } from '../domain/types'

interface QuotationLineItemRowProps {
  index: number
  line: DraftLine
  lineTotal: Money | null
  onChange: (index: number, updated: DraftLine) => void
  onRemove: (index: number) => void
  canRemove: boolean
  errors?: {
    description?: string
    quantity?: string
    unit?: string
    unitPrice?: string
    lineTotal?: string
  }
}

export default function QuotationLineItemRow({
  index,
  line,
  lineTotal,
  onChange,
  onRemove,
  canRemove,
  errors,
}: QuotationLineItemRowProps) {
  const lineNum = index + 1

  return (
    <div className="quotation-line-row" data-testid={`line-row-${index}`}>
      <div className="line-field line-desc">
        <label htmlFor={`line-desc-${index}`}>
          Line {lineNum} Description
        </label>
        <input
          id={`line-desc-${index}`}
          type="text"
          placeholder="e.g. 50 Navy polo shirts · L"
          value={line.description}
          onChange={(e) => onChange(index, { ...line, description: e.target.value })}
          aria-invalid={Boolean(errors?.description)}
        />
        {errors?.description && (
          <small className="field-error-text">{errors.description}</small>
        )}
      </div>

      <div className="line-field line-qty">
        <label htmlFor={`line-qty-${index}`}>Quantity</label>
        <input
          id={`line-qty-${index}`}
          type="text"
          inputMode="decimal"
          placeholder="1"
          value={line.quantity ?? ''}
          onChange={(e) => onChange(index, { ...line, quantity: e.target.value })}
          aria-invalid={Boolean(errors?.quantity)}
        />
        {errors?.quantity && (
          <small className="field-error-text">{errors.quantity}</small>
        )}
      </div>

      <div className="line-field line-unit">
        <label htmlFor={`line-unit-${index}`}>Unit</label>
        <input
          id={`line-unit-${index}`}
          type="text"
          placeholder="pcs"
          value={line.unit}
          onChange={(e) => onChange(index, { ...line, unit: e.target.value })}
          aria-invalid={Boolean(errors?.unit)}
        />
        {errors?.unit && (
          <small className="field-error-text">{errors.unit}</small>
        )}
      </div>

      <div className="line-field line-price">
        <label htmlFor={`line-price-${index}`}>Unit Price (RM)</label>
        <input
          id={`line-price-${index}`}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={line.unitPrice ?? ''}
          onChange={(e) => onChange(index, { ...line, unitPrice: e.target.value })}
          aria-invalid={Boolean(errors?.unitPrice)}
        />
        {errors?.unitPrice && (
          <small className="field-error-text">{errors.unitPrice}</small>
        )}
      </div>

      <div className="line-field line-total">
        <label>Line Total</label>
        <div className="line-total-display">
          <strong>{lineTotal !== null ? formatMYR(lineTotal) : '—'}</strong>
        </div>
        {errors?.lineTotal && (
          <small className="field-error-text" role="alert">{errors.lineTotal}</small>
        )}
      </div>

      <div className="line-actions">
        <button
          type="button"
          className="remove-line-btn"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          aria-label={`Remove line ${lineNum}`}
          title="Remove line item"
        >
          ×
        </button>
      </div>
    </div>
  )
}
