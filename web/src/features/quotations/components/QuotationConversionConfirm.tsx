import { formatMalaysiaDate, formatMYR } from '../../../lib/formatters'
import type { QuotationView } from '../domain/types'

interface QuotationConversionConfirmProps {
  quotation: QuotationView
  onConfirm: () => void
  onCancel: () => void
  isSubmitting?: boolean
  error?: string | null
}

export default function QuotationConversionConfirm({
  quotation,
  onConfirm,
  onCancel,
  isSubmitting = false,
  error = null,
}: QuotationConversionConfirmProps) {
  return (
    <div className="conversion-confirm-dialog" data-testid="conversion-confirm-dialog">
      <div className="conversion-notice">
        <h3>Confirm Job Conversion</h3>
        <p>
          Converting quotation <strong>{quotation.number}</strong> (Revision {quotation.revision}) will create a new
          production job in <strong>Pending</strong> status and lock this quotation family from further revisions or edits.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="conversion-summary-card">
        <div className="summary-meta-row">
          <div>
            <small>Customer</small>
            <strong>{quotation.customerName || '— (None)'}</strong>
          </div>
          <div>
            <small>Requested Due Date</small>
            <strong>{quotation.dueDate ? formatMalaysiaDate(quotation.dueDate) : '—'}</strong>
          </div>
          <div>
            <small>Enquiry source</small>
            <span>{quotation.sourceNote || '—'}</span>
          </div>
        </div>

        <div className="table-wrap conversion-items-table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lines.map((line, idx) => (
                <tr key={line.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{line.unit}</td>
                  <td>{line.unitPrice ? formatMYR(line.unitPrice) : '—'}</td>
                  <td>
                    <strong>{quotation.lineTotals[idx] ? formatMYR(quotation.lineTotals[idx]!) : '—'}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="conversion-totals-row">
          <div>
            Subtotal: <strong>{formatMYR(quotation.totals.subtotal)}</strong>
          </div>
          {quotation.totals.discountAmount !== '0.00' && (
            <div>
              Discount: -{formatMYR(quotation.totals.discountAmount)}
            </div>
          )}
          {quotation.totals.taxRate !== '0.00' && (
            <div>
              Tax ({quotation.totals.taxRate}%): +{formatMYR(quotation.totals.taxAmount)}
            </div>
          )}
          <div className="grand-total">
            Grand Total: <strong>{formatMYR(quotation.totals.grandTotal)}</strong>
          </div>
        </div>

        {quotation.notes && (
          <div className="conversion-notes">
            <small>Notes:</small> {quotation.notes}
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="primary"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Converting to Job...' : 'Confirm & Convert to Job'}
        </button>
      </div>
    </div>
  )
}
