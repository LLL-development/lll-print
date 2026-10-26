package my.lllprint.server.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import my.lllprint.server.catalogue.ChargedPer;

/**
 * Level three: one size entry. Twenty on the real order.
 *
 * <p>It hangs off its garment group, so MySQL will not let a size exist without
 * one. That is what holds the grouping up, rather than care (FR-1.14).
 *
 * <p>The note identifies one piece, such as a name or a number (FR-1.4).
 */
@Entity
@Table(name = "quotation_size")
public class QuotationSize {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "quotation_garment_group_id", nullable = false)
	private Long garmentGroupId;

	@Column(name = "catalogue_option_id")
	private Long catalogueOptionId;

	@Column(name = "name", nullable = false, length = 200)
	private String name;

	@Column(name = "price_sen", nullable = false)
	private long priceSen;

	@Column(name = "charged_per", nullable = false, length = 10)
	private ChargedPer chargedPer;

	@Column(name = "quantity", nullable = false)
	private int quantity;

	@Column(name = "note", length = 200)
	private String note;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	protected QuotationSize() {
		// for JPA
	}

	public QuotationSize(Long shopId, Long garmentGroupId, OrderToPrice.Chosen chosen, int quantity, String note,
			int sortOrder) {
		this.shopId = shopId;
		this.garmentGroupId = garmentGroupId;
		this.catalogueOptionId = chosen.catalogueOptionId();
		this.name = chosen.name();
		this.priceSen = chosen.priceSen();
		this.chargedPer = chosen.chargedPer();
		this.quantity = quantity;
		this.note = note;
		this.sortOrder = sortOrder;
	}

	public OrderToPrice.Chosen chosen() {
		return new OrderToPrice.Chosen(catalogueOptionId, name, priceSen, chargedPer);
	}

	public Long id() {
		return id;
	}

	public Long garmentGroupId() {
		return garmentGroupId;
	}

	public String name() {
		return name;
	}

	public long priceSen() {
		return priceSen;
	}

	public int quantity() {
		return quantity;
	}

	public String note() {
		return note;
	}

	public int sortOrder() {
		return sortOrder;
	}

}
