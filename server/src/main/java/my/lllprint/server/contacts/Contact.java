package my.lllprint.server.contacts;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * One customer (FR-9).
 *
 * <p>There is no kind, type or category here. These are customers; suppliers
 * belong to the stock world, which is out of scope.
 *
 * <p>Correcting a customer never rewrites a quotation, job or invoice already
 * made, because each of those keeps its own copy of what was true at the time
 * (FR-9.4, FR-2.2).
 */
@Entity
@Table(name = "contact")
public class Contact {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "name", nullable = false, length = 200)
	private String name;

	@Column(name = "phone", length = 40)
	private String phone;

	@Column(name = "email", length = 254)
	private String email;

	@Column(name = "address", length = 500)
	private String address;

	/** For the shop only. It never appears on anything a customer sees (FR-9.5). */
	@Column(name = "internal_note", length = 2000)
	private String internalNote;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
	private Instant updatedAt;

	@Version
	@Column(name = "version", nullable = false)
	private Long version;

	protected Contact() {
		// for JPA
	}

	public Contact(Long shopId, String name, String phone, String email, String address, String internalNote) {
		this.shopId = shopId;
		this.name = name;
		this.phone = phone;
		this.email = email;
		this.address = address;
		this.internalNote = internalNote;
	}

	public void change(String name, String phone, String email, String address, String internalNote) {
		this.name = name;
		this.phone = phone;
		this.email = email;
		this.address = address;
		this.internalNote = internalNote;
	}

	public Long id() {
		return id;
	}

	public Long shopId() {
		return shopId;
	}

	public String name() {
		return name;
	}

	public String phone() {
		return phone;
	}

	public String email() {
		return email;
	}

	public String address() {
		return address;
	}

	public String internalNote() {
		return internalNote;
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
