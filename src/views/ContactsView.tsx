import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSyntheticStore } from '../context/useSyntheticStore'
import type { Contact } from '../domain/models'

export default function ContactsView() {
  const navigate = useNavigate()
  const { state, openModal } = useSyntheticStore()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter to Customer contacts only (suppliers excluded per design)
  const allCustomers = useMemo(
    () => state.contacts.filter((c) => c.type === 'Customer'),
    [state.contacts],
  )

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allCustomers
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    )
  }, [allCustomers, searchQuery])

  function handleNewQuotation(customer: Contact) {
    navigate('/quotations')
    openModal('quote', { customerId: customer.id })
  }

  const countLabel =
    searchQuery.trim() && filteredCustomers.length !== allCustomers.length
      ? `${filteredCustomers.length} of ${allCustomers.length} customers`
      : `${allCustomers.length} ${allCustomers.length === 1 ? 'customer' : 'customers'}`

  return (
    <div className="contacts-view">
      {/* 1. Clean Calm Hero Header Card */}
      <section className="contacts-hero-card" aria-label="Page hero">
        <div className="contacts-hero-left">
          <div className="contacts-hero-icon-badge" aria-hidden="true">
            <span>📇</span>
          </div>
          <div className="contacts-hero-text">
            <div className="contacts-hero-eyebrow">
              <span className="eyebrow-tag">● Customer Directory</span>
            </div>
            <h1 className="contacts-hero-title">Customers</h1>
            <p className="contacts-hero-desc">
              Choose an existing customer to prepare a quotation, or register a new customer account.
            </p>
          </div>
        </div>

        <div className="contacts-hero-actions">
          <button
            type="button"
            className="primary contacts-primary-btn"
            onClick={() => openModal('contact')}
          >
            + Add customer
          </button>
        </div>
      </section>

      {/* 3. Search and Live Filter Toolbar */}
      <div className="contacts-toolbar">
        <div className="contacts-search-box">
          <span className="contacts-search-icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            className="contacts-search-input"
            placeholder="Search customers by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search customers"
          />
          {searchQuery && (
            <button
              type="button"
              className="contacts-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search input"
            >
              ✕
            </button>
          )}
        </div>
        <div className="contacts-count-badge" aria-live="polite">
          {countLabel}
        </div>
      </div>

      {/* 4. Customer Cards Grid & Empty States */}
      {allCustomers.length === 0 ? (
        <div className="contacts-empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            📇
          </div>
          <h3>No customers added yet</h3>
          <p>Add your first customer contact to begin preparing quotation drafts.</p>
          <button
            type="button"
            className="primary"
            onClick={() => openModal('contact')}
          >
            + Add your first customer
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="contacts-empty-state">
          <div className="empty-state-icon" aria-hidden="true">
            🔍
          </div>
          <h3>No customers matching "{searchQuery}"</h3>
          <p>Check the spelling or add a new customer with this name.</p>
          <div className="empty-state-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </button>
            <button
              type="button"
              className="primary"
              onClick={() => openModal('contact')}
            >
              + Add customer
            </button>
          </div>
        </div>
      ) : (
        <section className="contacts-grid" aria-label="Customer list">
          {filteredCustomers.map((customer) => {
            const customerQuotesCount = state.quotations.filter(
              (q) => q.customerId === customer.id,
            ).length

            // Generate initials monogram for customer avatar
            const initials = customer.name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'C'

            return (
              <article key={customer.id} className="customer-card">
                <div className="customer-card-header">
                  <div className="customer-avatar" aria-hidden="true">
                    <span>{initials}</span>
                  </div>
                  <div className="customer-card-identity">
                    <h3 className="customer-card-name">{customer.name}</h3>
                    <div className="customer-badges-row">
                      <span className="customer-card-id">{customer.id}</span>
                      <span className="customer-type-pill">Customer</span>
                    </div>
                  </div>
                </div>

                <div className="customer-card-details">
                  <div className="customer-detail-row">
                    <span className="customer-detail-icon" aria-hidden="true">
                      📞
                    </span>
                    <a
                      href={`tel:${customer.phone}`}
                      className="customer-phone-link"
                      title={`Call ${customer.name}`}
                    >
                      {customer.phone}
                    </a>
                  </div>

                  <div className="customer-detail-row">
                    <span className="customer-detail-icon" aria-hidden="true">
                      ✉
                    </span>
                    {customer.email ? (
                      <a
                        href={`mailto:${customer.email}`}
                        className="customer-email-link"
                        title={`Email ${customer.name}`}
                      >
                        {customer.email}
                      </a>
                    ) : (
                      <span className="customer-detail-muted">No email on file</span>
                    )}
                  </div>
                </div>

                <div className="customer-card-footer">
                  <div className="customer-activity-chip">
                    <span className="activity-dot" aria-hidden="true" />
                    <span>
                      {customerQuotesCount === 0
                        ? 'Ready for quotation'
                        : `${customerQuotesCount} ${customerQuotesCount === 1 ? 'quote' : 'quotes'} in history`}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-quote-action"
                    onClick={() => handleNewQuotation(customer)}
                  >
                    + New quotation
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
