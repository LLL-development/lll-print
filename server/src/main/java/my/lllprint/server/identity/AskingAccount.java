package my.lllprint.server.identity;

import java.util.Collections;
import java.util.Set;

/**
 * Who is asking, and what they may do, as read from the database on this
 * request.
 *
 * <p>Nothing here comes from the browser. The token says who, and nothing more;
 * the role, the shop and the grants are all read from the account's own rows
 * every single time (SEC-2, D-AF).
 */
public record AskingAccount(
		Long accountId,
		Long shopId,
		Long sessionId,
		String name,
		String username,
		StaffRole role,
		Set<GrantAction> grants) {

	public AskingAccount {
		grants = grants == null ? Set.of() : Collections.unmodifiableSet(Set.copyOf(grants));
	}

	public boolean isAdmin() {
		return role == StaffRole.ADMIN;
	}

	/**
	 * Whether this account may take one of the eleven granted actions.
	 *
	 * <p>Admin may take all of them. A Staff account may take the ones Admin has
	 * ticked. This never unlocks an action that is Admin alone, which is a
	 * separate question and FR-10.3 says no grant ever overrides it.
	 */
	public boolean may(GrantAction action) {
		return isAdmin() || grants.contains(action);
	}

}
