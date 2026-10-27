package my.lllprint.server.api;

import my.lllprint.server.identity.AskingAccount;
import my.lllprint.server.identity.GrantAction;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * The one way the rest of the server asks who is asking.
 *
 * <p>Being signed in is never enough on its own. Every endpoint says what it
 * requires, either the Admin role or a named grant, and anything matching
 * nothing is refused (SEC-1, SDD section 5).
 */
@Component
public class CurrentAccount {

	/** Who is asking, or a refusal if this request is not signed in. */
	public AskingAccount get() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null || !(authentication.getPrincipal() instanceof AskingAccount account)) {
			throw Refused.notSignedIn();
		}
		return account;
	}

	/** For an action that is Admin alone, which no grant ever unlocks (FR-10.3, FR-10.5). */
	public AskingAccount requireAdmin() {
		AskingAccount account = get();
		if (!account.isAdmin()) {
			throw Refused.notAllowed();
		}
		return account;
	}

	/** For one of the eleven granted actions (FR-10.2, SEC-3). */
	public AskingAccount require(GrantAction action) {
		AskingAccount account = get();
		if (!account.may(action)) {
			throw Refused.notAllowed();
		}
		return account;
	}

}
