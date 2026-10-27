package my.lllprint.server.identity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * One person who signs in. Admin or Staff (FR-10).
 *
 * <p>Everything the server decides starts here. The role and the grants are
 * read from these rows on every request and never taken from what the browser
 * sent (SEC-2, D-AF).
 *
 * <p>An account is switched off and never deleted, so history keeps pointing at
 * a real account (FR-10.1).
 */
@Entity
@Table(name = "staff_account")
public class StaffAccount {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** Every record names its shop, and the server fills it in, never the browser (D-M, SEC-2). */
	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "name", nullable = false, length = 200)
	private String name;

	@Column(name = "username", nullable = false, length = 100)
	private String username;

	@Column(name = "email", length = 254)
	private String email;

	/** Hashed, never readable back. No endpoint returns it, including to an Admin (SEC-6). */
	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Column(name = "role", nullable = false, length = 10)
	private StaffRole role;

	/**
	 * How an account is stopped. Setting this false refuses its next request on
	 * every device at once, because the server reads this row every time
	 * (FR-10.1, SEC-6).
	 */
	@Column(name = "active", nullable = false)
	private boolean active = true;

	@Column(name = "created_at", nullable = false, insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
	private Instant updatedAt;

	@Version
	@Column(name = "version", nullable = false)
	private Long version;

	protected StaffAccount() {
		// for JPA
	}

	public StaffAccount(Long shopId, String name, String username, String email, String passwordHash,
			StaffRole role) {
		this.shopId = shopId;
		this.name = name;
		this.username = username;
		this.email = email;
		this.passwordHash = passwordHash;
		this.role = role;
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

	public String username() {
		return username;
	}

	public String email() {
		return email;
	}

	public String passwordHash() {
		return passwordHash;
	}

	public StaffRole role() {
		return role;
	}

	public boolean isActive() {
		return active;
	}

	public void switchOff() {
		this.active = false;
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
