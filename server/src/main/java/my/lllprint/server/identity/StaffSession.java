package my.lllprint.server.identity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One live session. Written when an account signs in, ended when it signs out
 * (SEC-6).
 *
 * <p>The token itself is never stored, only a SHA-256 of it, so a copy of the
 * database hands over no working session.
 */
@Entity
@Table(name = "staff_session")
public class StaffSession {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "staff_account_id", nullable = false)
	private Long staffAccountId;

	@Column(name = "token_hash", nullable = false, length = 64)
	private String tokenHash;

	@Column(name = "issued_at", nullable = false, insertable = false, updatable = false)
	private Instant issuedAt;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "ended_at")
	private Instant endedAt;

	protected StaffSession() {
		// for JPA
	}

	public StaffSession(Long shopId, Long staffAccountId, String tokenHash, Instant expiresAt) {
		this.shopId = shopId;
		this.staffAccountId = staffAccountId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
	}

	public Long id() {
		return id;
	}

	public Long shopId() {
		return shopId;
	}

	public Long staffAccountId() {
		return staffAccountId;
	}

	public Instant expiresAt() {
		return expiresAt;
	}

	public Instant endedAt() {
		return endedAt;
	}

	/** Signing out. From this moment the token is refused everywhere (SEC-6). */
	public void end(Instant when) {
		if (this.endedAt == null) {
			this.endedAt = when;
		}
	}

	/** Usable only while it has not been ended and has not run out. */
	public boolean isLiveAt(Instant when) {
		return endedAt == null && expiresAt.isAfter(when);
	}

}
