package my.lllprint.server.catalogue;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * One option button the shop offers (FR-12.1, FR-12.2).
 *
 * <p>A material is one option with its weight in its name, so
 * {@code EYELAT 170gsm} is one button rather than a cloth plus a weight (D-W).
 *
 * <p>An option is never deleted. It stops being offered, and every quotation,
 * job and invoice that already used it stays exactly as it was (FR-12.5,
 * FR-12.7).
 */
@Entity
@Table(name = "catalogue_option")
public class CatalogueOption {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "kind", nullable = false, length = 30)
	private OptionKind kind;

	@Column(name = "name", nullable = false, length = 200)
	private String name;

	/**
	 * Whole sen. RM 28.00 is 2800.
	 *
	 * <p>It may be below zero, because that is how a thing worth less is
	 * expressed: Kids at minus RM 2.00 is -200. There is deliberately no rule
	 * against it here or in the database (FR-1.9, FR-12.2).
	 */
	@Column(name = "standard_price_sen", nullable = false)
	private long standardPriceSen;

	@Column(name = "charged_per", nullable = false, length = 10)
	private ChargedPer chargedPer;

	/** False stops it appearing on a new order and changes no existing record (FR-12.5). */
	@Column(name = "offered", nullable = false)
	private boolean offered = true;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
	private Instant updatedAt;

	@Version
	@Column(name = "version", nullable = false)
	private Long version;

	protected CatalogueOption() {
		// for JPA
	}

	public CatalogueOption(Long shopId, OptionKind kind, String name, long standardPriceSen, ChargedPer chargedPer,
			int sortOrder) {
		this.shopId = shopId;
		this.kind = kind;
		this.name = name;
		this.standardPriceSen = standardPriceSen;
		this.chargedPer = chargedPer;
		this.sortOrder = sortOrder;
	}

	/**
	 * Changes what Admin may change: the name, the standard price, how it is
	 * charged, whether it is still offered, and where it sits in the list
	 * (FR-12.4, FR-12.5).
	 *
	 * <p>The kind is not among them. Moving an option from one list to another
	 * would change what an existing order meant, and the lists are kept apart
	 * (FR-12.1).
	 */
	public void change(String name, long standardPriceSen, ChargedPer chargedPer, boolean offered, int sortOrder) {
		this.name = name;
		this.standardPriceSen = standardPriceSen;
		this.chargedPer = chargedPer;
		this.offered = offered;
		this.sortOrder = sortOrder;
	}

	public Long id() {
		return id;
	}

	public Long shopId() {
		return shopId;
	}

	public OptionKind kind() {
		return kind;
	}

	public String name() {
		return name;
	}

	public long standardPriceSen() {
		return standardPriceSen;
	}

	public ChargedPer chargedPer() {
		return chargedPer;
	}

	public boolean isOffered() {
		return offered;
	}

	public int sortOrder() {
		return sortOrder;
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
