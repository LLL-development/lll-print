export const MALAYSIA_LOCALE = 'en-MY'
export const MALAYSIA_TIME_ZONE = 'Asia/Kuala_Lumpur'

export const myrCurrencyFormatter = new Intl.NumberFormat(MALAYSIA_LOCALE, {
  style: 'currency', currency: 'MYR', minimumFractionDigits: 2, maximumFractionDigits: 2,
})
export const malaysiaDateFormatter = new Intl.DateTimeFormat(MALAYSIA_LOCALE, {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: MALAYSIA_TIME_ZONE,
})
export const malaysiaDateTimeFormatter = new Intl.DateTimeFormat(MALAYSIA_LOCALE, {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  hour12: false, timeZone: MALAYSIA_TIME_ZONE,
})

export function formatMYR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '' || value === '—') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return myrCurrencyFormatter.format(num)
}
export function formatMalaysiaDate(value: Date | string | number) { return malaysiaDateFormatter.format(new Date(value)) }
export function formatMalaysiaDateTime(value: Date | string | number) { return malaysiaDateTimeFormatter.format(new Date(value)) }
