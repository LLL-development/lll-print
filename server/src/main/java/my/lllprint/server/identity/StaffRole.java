package my.lllprint.server.identity;

/**
 * What an account is. Admin, or Staff.
 *
 * <p>The two values are the only ones the database accepts, by the check
 * constraint on {@code staff_account.role} (FR-10, SDD section 4).
 */
public enum StaffRole {

	ADMIN("admin"),
	STAFF("staff");

	private final String code;

	StaffRole(String code) {
		this.code = code;
	}

	/** The value as the database stores it. */
	public String code() {
		return code;
	}

	public static StaffRole ofCode(String code) {
		for (StaffRole role : values()) {
			if (role.code.equals(code)) {
				return role;
			}
		}
		throw new IllegalArgumentException("not a role this system knows: " + code);
	}

}
