package my.lllprint.server.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * The last number given out, for one shop and one kind of document (D-X).
 *
 * <p>Reading it, raising it by one, and creating the record that takes the
 * number all happen inside one transaction, so two orders made at the same
 * moment cannot both take Q-0001.
 *
 * <p>Nothing reads this to show anything. It is not a count of records.
 */
@Entity
@Table(name = "document_number")
public class DocumentNumber {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "kind", nullable = false, length = 20)
	private String kind;

	@Column(name = "last_number", nullable = false)
	private long lastNumber;

	protected DocumentNumber() {
		// for JPA
	}

	public DocumentNumber(Long shopId, String kind) {
		this.shopId = shopId;
		this.kind = kind;
	}

	public long takeTheNext() {
		this.lastNumber = this.lastNumber + 1;
		return this.lastNumber;
	}

	public long lastNumber() {
		return lastNumber;
	}

}
