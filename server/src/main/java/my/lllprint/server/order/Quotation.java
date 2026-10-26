package my.lllprint.server.order;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * The order being typed, and later the quotation it becomes (FR-1, FR-2).
 *
 * <p>There is no separate order record. A draft quotation **is** the order, so
 * the form's save and the quotation's save are the same write (FR-1.10,
 * FR-2.1).
 *
 * <p>The totals are stored so a document can be reproduced exactly, and the
 * server works them out again on every read and every write (SEC-7).
 */
@Entity
@Table(name = "quotation")
public class Quotation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	/** Q-0001, taken from the numbering table inside one transaction (D-X). */
	@Column(name = "number", nullable = false, length = 20, updatable = false)
	private String number;

	@Column(name = "state", nullable = false, length = 20)
	private QuotationState state = QuotationState.DRAFT;

	/** The first thing typed, and the name the order is known by (FR-1.2). */
	@Column(name = "job_title", nullable = false, length = 200)
	private String jobTitle;

	@Column(name = "contact_id")
	private Long contactId;

	@Column(name = "customer_name", length = 200)
	private String customerName;

	@Column(name = "customer_phone", length = 40)
	private String customerPhone;

	@Column(name = "customer_email", length = 254)
	private String customerEmail;

	@Column(name = "customer_address", length = 500)
	private String customerAddress;

	@Column(name = "date_wanted")
	private LocalDate dateWanted;

	@Column(name = "valid_until")
	private LocalDate validUntil;

	/**
	 * The base price per piece, copied from the cloth as it was shown, or a
	 * one-off price Admin typed over it (FR-1.4a, FR-1.5).
	 */
	@Column(name = "price_per_piece_sen", nullable = false)
	private long pricePerPieceSen;

	@Column(name = "source_note", length = 500)
	private String sourceNote;

	@Column(name = "item_subtotal_sen", nullable = false)
	private long itemSubtotalSen;

	@Column(name = "shipping_charge_sen", nullable = false)
	private long shippingChargeSen;

	@Column(name = "grand_total_sen", nullable = false)
	private long grandTotalSen;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
	private Instant updatedAt;

	@Version
	@Column(name = "version", nullable = false)
	private Long version;

	protected Quotation() {
		// for JPA
	}

	public Quotation(Long shopId, String number, String jobTitle) {
		this.shopId = shopId;
		this.number = number;
		this.jobTitle = jobTitle;
	}

	/** What the order form writes. Accepted only while this is a draft (SDD section 6). */
	public void typedOnTheForm(String jobTitle, Long contactId, String customerName, String customerPhone,
			String customerEmail, String customerAddress, LocalDate dateWanted, String sourceNote,
			long shippingChargeSen) {
		this.jobTitle = jobTitle;
		this.contactId = contactId;
		this.customerName = customerName;
		this.customerPhone = customerPhone;
		this.customerEmail = customerEmail;
		this.customerAddress = customerAddress;
		this.dateWanted = dateWanted;
		this.sourceNote = sourceNote;
		this.shippingChargeSen = shippingChargeSen;
	}

	/** The totals the server worked out, stored as a copy of what was shown (SEC-7). */
	public void totals(long pricePerPieceSen, long itemSubtotalSen, long grandTotalSen) {
		this.pricePerPieceSen = pricePerPieceSen;
		this.itemSubtotalSen = itemSubtotalSen;
		this.grandTotalSen = grandTotalSen;
	}

	public boolean isDraft() {
		return state == QuotationState.DRAFT;
	}

	public Long id() {
		return id;
	}

	public Long shopId() {
		return shopId;
	}

	public String number() {
		return number;
	}

	public QuotationState state() {
		return state;
	}

	public String jobTitle() {
		return jobTitle;
	}

	public Long contactId() {
		return contactId;
	}

	public String customerName() {
		return customerName;
	}

	public String customerPhone() {
		return customerPhone;
	}

	public String customerEmail() {
		return customerEmail;
	}

	public String customerAddress() {
		return customerAddress;
	}

	public LocalDate dateWanted() {
		return dateWanted;
	}

	public LocalDate validUntil() {
		return validUntil;
	}

	public long pricePerPieceSen() {
		return pricePerPieceSen;
	}

	public String sourceNote() {
		return sourceNote;
	}

	public long itemSubtotalSen() {
		return itemSubtotalSen;
	}

	public long shippingChargeSen() {
		return shippingChargeSen;
	}

	public long grandTotalSen() {
		return grandTotalSen;
	}

	public Instant createdAt() {
		return createdAt;
	}

	public Instant updatedAt() {
		return updatedAt;
	}

	public Long version() {
		return version;
	}

}
