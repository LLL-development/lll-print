package my.lllprint.server.identity;

import java.util.Optional;

/**
 * The eleven named business actions Admin may grant to a Staff account
 * (FR-10.2).
 *
 * <p>These are the actions the shop cares about, not shapes like "may edit
 * jobs" (SDD section 5). The same eleven are a check constraint on
 * {@code staff_grant.action}, so an invented action is refused by MySQL before
 * it reaches any of our code.
 *
 * <p>The set is fixed here, decided up front, rather than being tidied up
 * later.
 */
public enum GrantAction {

	SEE_RELEASED_JOB("see_released_job"),
	ATTACH_MOCKUP("attach_mockup"),
	COMPLETE_STEP("complete_step"),
	SKIP_STEP("skip_step"),
	RETURN_TO_STEP("return_to_step"),
	RECORD_POSTED("record_posted"),
	RECORD_COLLECTED("record_collected"),
	RECORD_PAYMENT("record_payment"),
	VOID_PAYMENT("void_payment"),
	RECORD_REFUND("record_refund"),
	MAINTAIN_CATALOGUE("maintain_catalogue");

	private final String code;

	GrantAction(String code) {
		this.code = code;
	}

	/** The value as the database stores it, and as the API uses it. */
	public String code() {
		return code;
	}

	public static Optional<GrantAction> find(String code) {
		for (GrantAction action : values()) {
			if (action.code.equals(code)) {
				return Optional.of(action);
			}
		}
		return Optional.empty();
	}

	public static GrantAction ofCode(String code) {
		return find(code).orElseThrow(
				() -> new IllegalArgumentException("not a granted action this system knows: " + code));
	}

}
