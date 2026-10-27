package my.lllprint.server.api;

import java.util.List;

import my.lllprint.server.identity.AskingAccount;
import my.lllprint.server.identity.GrantAction;

/**
 * Who is signed in, and every grant that account holds, which is what lets a
 * screen say plainly what the account may do (FR-10.6).
 *
 * <p>The password hash is not here, and is in no reply anywhere (SEC-6).
 */
public record MeReply(
		Long id,
		String name,
		String username,
		String role,
		boolean admin,
		List<String> grants) {

	public static MeReply of(AskingAccount account) {
		return new MeReply(
				account.accountId(),
				account.name(),
				account.username(),
				account.role().code(),
				account.isAdmin(),
				account.grants().stream().map(GrantAction::code).sorted().toList());
	}

}
