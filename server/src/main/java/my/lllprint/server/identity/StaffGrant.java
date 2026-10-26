package my.lllprint.server.identity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One granted action for one account (FR-10.2).
 *
 * <p>One row per grant rather than one column per grant, so a new grant is a
 * new row and not a change to the table shape (SDD section 4).
 *
 * <p>A new account has no rows here at all, so it can do nothing until Admin
 * grants something (FR-10.1).
 */
@Entity
@Table(name = "staff_grant")
public class StaffGrant {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "shop_id", nullable = false)
	private Long shopId;

	@Column(name = "staff_account_id", nullable = false)
	private Long staffAccountId;

	@Column(name = "action", nullable = false, length = 40)
	private GrantAction action;

	@Column(name = "granted_at", nullable = false, insertable = false, updatable = false)
	private Instant grantedAt;

	protected StaffGrant() {
		// for JPA
	}

	public StaffGrant(Long shopId, Long staffAccountId, GrantAction action) {
		this.shopId = shopId;
		this.staffAccountId = staffAccountId;
		this.action = action;
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

	public GrantAction action() {
		return action;
	}

	public Instant grantedAt() {
		return grantedAt;
	}

}
