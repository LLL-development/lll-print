package my.lllprint.server.catalogue;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * A price for one customer against one option (FR-12.6).
 *
 * <p>Where one exists it is used instead of the standard price, by FR-1.5. The
 * options themselves are the same for every customer; only the prices differ.
 *
 * <p>Since the cloth carries the base price per piece, a customer may have
 * their own base price too, and nothing special was needed to allow it
 * (FR-1.4a).
 */
@Entity
@Table(name = "customer_price")
public class CustomerPrice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "contact_id", nullable = false)
	private Long contactId;

	@Column(name = "catalogue_option_id", nullable = false)
	private Long catalogueOptionId;

	@Column(name = "price_sen", nullable = false)
	private long priceSen;

	@Version
	@Column(name = "version", nullable = false)
	private Long version;

	protected CustomerPrice() {
		// for JPA
	}

	public CustomerPrice(Long shopId, Long contactId, Long catalogueOptionId, long priceSen) {
		this.shopId = shopId;
		this.contactId = contactId;
		this.catalogueOptionId = catalogueOptionId;
		this.priceSen = priceSen;
	}

	public Long id() {
		return id;
	}

	public Long contactId() {
		return contactId;
	}

	public Long catalogueOptionId() {
		return catalogueOptionId;
	}

	public long priceSen() {
		return priceSen;
	}

}
