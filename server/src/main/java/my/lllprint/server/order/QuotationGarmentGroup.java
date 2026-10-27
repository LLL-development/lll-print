package my.lllprint.server.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import my.lllprint.server.catalogue.ChargedPer;

/**
 * Level two: one garment group. Five on the real order.
 *
 * <p>Its neck and its sleeve are each kept as the option they came from plus
 * the name, price and way of charging that were shown (FR-2.2).
 *
 * <p>The note carries no price. It is free text such as {@code readymade}
 * (D-E).
 */
@Entity
@Table(name = "quotation_garment_group")
public class QuotationGarmentGroup {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "quotation_id", nullable = false)
	private Long quotationId;

	@Column(name = "neck_option_id")
	private Long neckOptionId;

	@Column(name = "neck_name", length = 200)
	private String neckName;

	@Column(name = "neck_price_sen")
	private Long neckPriceSen;

	@Column(name = "neck_charged_per", length = 10)
	private ChargedPer neckChargedPer;

	@Column(name = "sleeve_option_id")
	private Long sleeveOptionId;

	@Column(name = "sleeve_name", length = 200)
	private String sleeveName;

	@Column(name = "sleeve_price_sen")
	private Long sleevePriceSen;

	@Column(name = "sleeve_charged_per", length = 10)
	private ChargedPer sleeveChargedPer;

	@Column(name = "note", length = 500)
	private String note;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	protected QuotationGarmentGroup() {
		// for JPA
	}

	public QuotationGarmentGroup(Long shopId, Long quotationId, String note, int sortOrder) {
		this.shopId = shopId;
		this.quotationId = quotationId;
		this.note = note;
		this.sortOrder = sortOrder;
	}

	public void neck(OrderToPrice.Chosen chosen) {
		if (chosen == null) {
			return;
		}
		this.neckOptionId = chosen.catalogueOptionId();
		this.neckName = chosen.name();
		this.neckPriceSen = chosen.priceSen();
		this.neckChargedPer = chosen.chargedPer();
	}

	public void sleeve(OrderToPrice.Chosen chosen) {
		if (chosen == null) {
			return;
		}
		this.sleeveOptionId = chosen.catalogueOptionId();
		this.sleeveName = chosen.name();
		this.sleevePriceSen = chosen.priceSen();
		this.sleeveChargedPer = chosen.chargedPer();
	}

	public OrderToPrice.Chosen neck() {
		return neckName == null ? null
				: new OrderToPrice.Chosen(neckOptionId, neckName, neckPriceSen, neckChargedPer);
	}

	public OrderToPrice.Chosen sleeve() {
		return sleeveName == null ? null
				: new OrderToPrice.Chosen(sleeveOptionId, sleeveName, sleevePriceSen, sleeveChargedPer);
	}

	public Long id() {
		return id;
	}

	public String note() {
		return note;
	}

	public int sortOrder() {
		return sortOrder;
	}

}
