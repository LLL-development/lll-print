import { formatMYR } from '../../../lib/formatters'
import type { Money, QuotationTotals, SendReadinessResult, TaxRate } from '../domain/types'
import SendReadinessBadge from './SendReadinessBadge'

interface QuotationTotalsSummaryProps {
  totals: QuotationTotals
  discountInput: Money
  taxRateInput: TaxRate
  onDiscountChange: (val: Money) => void
  onTaxRateChange: (val: TaxRate) => void
  discountError?: string
  taxRateError?: string
  readiness: SendReadinessResult
}

export default function QuotationTotalsSummary({
  totals,
  discountInput,
  taxRateInput,
  onDiscountChange,
  onTaxRateChange,
  discountError,
  taxRateError,
  readiness,
}: QuotationTotalsSummaryProps) {
  return (
    <div className="quotation-totals-card">
      <div className="totals-header">
        <h4>Commercial Summary</h4>
        {totals.provisional && (
          <span className="provisional-tag" title="Totals are provisional while fields or line items are incomplete">
            Provisional
          </span>
        )}
      </div>

      <div className="totals-row">
        <span>Subtotal</span>
        <strong>{totals.isSubtotalValid === false ? '—' : formatMYR(totals.subtotal)}</strong>
      </div>
      {totals.subtotalError && (
        <small id="subtotal-error" className="field-error-text" role="alert">
          {totals.subtotalError}
        </small>
      )}

      <div className="totals-row discount-row">
        <label htmlFor="quotation-discount-input">
          Discount (RM)
        </label>
        <div className="totals-input-wrap">
          <input
            id="quotation-discount-input"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={discountInput}
            onChange={(e) => onDiscountChange(e.target.value)}
            aria-invalid={Boolean(discountError)}
            aria-describedby={discountError ? 'discount-error' : undefined}
          />
        </div>
      </div>
      {discountError && (
        <small id="discount-error" className="field-error-text" role="alert">
          {discountError}
        </small>
      )}

      {totals.discountAmount !== '0.00' && totals.discountedSubtotal !== null && (
        <div className="totals-row sub-muted">
          <span>Discounted Subtotal</span>
          <span>{formatMYR(totals.discountedSubtotal)}</span>
        </div>
      )}

      <div className="totals-row tax-row">
        <label htmlFor="quotation-tax-input">
          Tax rate (%)
        </label>
        <div className="totals-input-wrap">
          <input
            id="quotation-tax-input"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={taxRateInput}
            onChange={(e) => onTaxRateChange(e.target.value)}
            aria-invalid={Boolean(taxRateError)}
            aria-describedby={taxRateError ? 'tax-rate-error' : undefined}
          />
        </div>
      </div>
      {taxRateError && (
        <small id="tax-rate-error" className="field-error-text" role="alert">
          {taxRateError}
        </small>
      )}

      {totals.taxRate !== '0.00' && totals.taxAmount !== null && (
        <div className="totals-row sub-muted">
          <span>Calculated Tax ({totals.taxRate}%)</span>
          <span>+{formatMYR(totals.taxAmount)}</span>
        </div>
      )}
      {totals.taxAmountError && (
        <small id="tax-amount-error" className="field-error-text" role="alert">
          {totals.taxAmountError}
        </small>
      )}

      <div className="totals-row grand-total-row">
        <span>Grand Total (MYR)</span>
        <strong className="grand-total-val">{formatMYR(totals.grandTotal)}</strong>
      </div>
      {totals.grandTotalError && (
        <small id="grand-total-error" className="field-error-text" role="alert">
          {totals.grandTotalError}
        </small>
      )}

      <hr className="totals-divider" />

      <SendReadinessBadge readiness={readiness} showDetails />
    </div>
  )
}
