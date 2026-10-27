package my.lllprint.server.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import my.lllprint.server.catalogue.ChargedPer;

/**
 * Level one: one specification typed once for the whole order (FR-1.3).
 *
 * <p>The name and the price are kept **as they were shown**, so changing the
 * catalogue tomorrow cannot alter what this customer was quoted today (FR-2.2,
 * FR-12.7).
 */
@Entity
@Table(name = "quotation_specification")
public class QuotationSpecification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "quotation_id", nullable = false)
	private Long quotationId;

	@Column(name = "kind", nullable = false, length = 30)
	private OrderToPrice.SpecificationKind kind;

	@Column(name = "catalogue_option_id")
	private Long catalogueOptionId;

	@Column(name = "name", nullable = false, length = 200)
	private String name;

	@Column(name = "price_sen", nullable = false)
	private long priceSen;

	@Column(name = "charged_per", nullable = false, length = 10)
	private ChargedPer chargedPer;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	protected QuotationSpecification() {
		// for JPA
	}

	public QuotationSpecification(Long shopId, Long quotationId, OrderToPrice.SpecificationKind kind,
			Long catalogueOptionId, String name, long priceSen, ChargedPer chargedPer, int sortOrder) {
		this.shopId = shopId;
		this.quotationId = quotationId;
		this.kind = kind;
		this.catalogueOptionId = catalogueOptionId;
		this.name = name;
		this.priceSen = priceSen;
		this.chargedPer = chargedPer;
		this.sortOrder = sortOrder;
	}

	public Long id() {
		return id;
	}

	public OrderToPrice.SpecificationKind kind() {
		return kind;
	}

	public Long catalogueOptionId() {
		return catalogueOptionId;
	}

	public String name() {
		return name;
	}

	public long priceSen() {
		return priceSen;
	}

	public ChargedPer chargedPer() {
		return chargedPer;
	}

	public int sortOrder() {
		return sortOrder;
	}

}
