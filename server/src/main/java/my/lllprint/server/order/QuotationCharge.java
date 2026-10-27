package my.lllprint.server.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import my.lllprint.server.catalogue.ChargedPer;

/**
 * A charge Admin typed on the whole order, such as artwork setup at RM 50.00
 * once (FR-1.6a).
 *
 * <p>There is no catalogue key, because a typed charge does not come from the
 * catalogue. The amount is never below zero, and MySQL refuses one as well
 * (D-Y).
 */
@Entity
@Table(name = "quotation_charge")
public class QuotationCharge {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "quotation_id", nullable = false)
	private Long quotationId;

	@Column(name = "name", nullable = false, length = 200)
	private String name;

	@Column(name = "amount_sen", nullable = false)
	private long amountSen;

	@Column(name = "charged_per", nullable = false, length = 10)
	private ChargedPer chargedPer;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	protected QuotationCharge() {
		// for JPA
	}

	public QuotationCharge(Long shopId, Long quotationId, String name, long amountSen, ChargedPer chargedPer,
			int sortOrder) {
		this.shopId = shopId;
		this.quotationId = quotationId;
		this.name = name;
		this.amountSen = amountSen;
		this.chargedPer = chargedPer;
		this.sortOrder = sortOrder;
	}

	public Long id() {
		return id;
	}

	public String name() {
		return name;
	}

	public long amountSen() {
		return amountSen;
	}

	public ChargedPer chargedPer() {
		return chargedPer;
	}

	public int sortOrder() {
		return sortOrder;
	}

}
