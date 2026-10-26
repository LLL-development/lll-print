package my.lllprint.server.identity;

import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import my.lllprint.server.api.Refusal;
import my.lllprint.server.api.Refused;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Signing in, signing out, and answering who is asking.
 *
 * <p>This is the one place that writes a session and the one place that reads an
 * account for a request. Everything else in the server asks this, so there is a
 * single answer to who is asking and what they may do (SDD section 5).
 */
@Service
public class SignInService {

	/**
	 * A hash of a value nobody knows, made fresh when the server starts and
	 * compared against when no account is found. It makes a wrong username and a
	 * wrong password take about the same time, so neither tells the caller which
	 * of the two it was. No password hash is written in this file.
	 */
	private final String somethingToCompareAgainst;

	private final StaffAccountRepository accounts;

	private final StaffGrantRepository grants;

	private final StaffSessionRepository sessions;

	private final PasswordEncoder passwords;

	private final SignedToken tokens;

	private final SignInSettings settings;

	private final Clock clock;

	public SignInService(StaffAccountRepository accounts, StaffGrantRepository grants,
			StaffSessionRepository sessions, PasswordEncoder passwords, SignedToken tokens,
			SignInSettings settings, Clock clock) {
		this.accounts = accounts;
		this.grants = grants;
		this.sessions = sessions;
		this.passwords = passwords;
		this.tokens = tokens;
		this.settings = settings;
		this.clock = clock;
		this.somethingToCompareAgainst = passwords.encode(UUID.randomUUID().toString());
	}

	/**
	 * Signs in and replies with the signed token and who was signed in.
	 *
	 * <p>A wrong username, a wrong password and a switched-off account are all
	 * refused in exactly the same way, so none of the three can be told apart
	 * from outside (SEC-2, FR-10.1).
	 */
	@Transactional
	public SignedIn signIn(String username, String password) {
		Optional<StaffAccount> found = onlyOneMatch(accounts.findByUsername(username == null ? "" : username.strip()));
		if (found.isEmpty()) {
			passwords.matches(password == null ? "" : password, somethingToCompareAgainst);
			throw wrongSignIn();
		}
		StaffAccount account = found.get();
		if (!passwords.matches(password == null ? "" : password, account.passwordHash())) {
			throw wrongSignIn();
		}
		if (!account.isActive()) {
			throw wrongSignIn();
		}

		Instant now = clock.instant();
		SignedToken.Issued issued = tokens.issue();
		StaffSession session = sessions.save(new StaffSession(account.shopId(), account.id(), issued.tokenHash(),
				now.plus(settings.sessionLength())));
		return new SignedIn(issued.token(), session.expiresAt(), asking(account, session.id()));
	}

	/**
	 * Signs out. The session is ended, so the token it belongs to is refused from
	 * now on, on every device at once (SEC-6).
	 *
	 * <p>Signing out twice is not an error. The session is already ended and the
	 * second request changes nothing.
	 */
	@Transactional
	public void signOut(Long sessionId) {
		sessions.findById(sessionId).ifPresent(session -> session.end(clock.instant()));
	}

	/**
	 * Who is asking, read from the database on this request.
	 *
	 * <p>Empty means the request is not signed in: the token was not made by this
	 * server, its session has been ended or has run out, or the account it
	 * belongs to has been switched off (SEC-6).
	 */
	@Transactional(readOnly = true)
	public Optional<AskingAccount> whoIsAsking(String token) {
		Instant now = clock.instant();
		return tokens.hashOfValidToken(token)
				.flatMap(sessions::findByTokenHash)
				.filter(session -> session.isLiveAt(now))
				.flatMap(session -> accounts.findById(session.staffAccountId())
						.filter(StaffAccount::isActive)
						.map(account -> asking(account, session.id())));
	}

	/** Reads the account grants from its own rows, which is what D-AF requires on every request. */
	private AskingAccount asking(StaffAccount account, Long sessionId) {
		Set<GrantAction> held = EnumSet.noneOf(GrantAction.class);
		for (StaffGrant grant : grants.findByStaffAccountId(account.id())) {
			held.add(grant.action());
		}
		return new AskingAccount(account.id(), account.shopId(), sessionId, account.name(), account.username(),
				account.role(), held);
	}

	private static Optional<StaffAccount> onlyOneMatch(List<StaffAccount> found) {
		return found.size() == 1 ? Optional.of(found.get(0)) : Optional.empty();
	}

	private static Refused wrongSignIn() {
		return new Refused(Refusal.NOT_SIGNED_IN, "That username and password do not match an account that can sign in.");
	}

	/** What signing in hands back: the token, when it runs out, and who it belongs to. */
	public record SignedIn(String token, Instant expiresAt, AskingAccount account) {
	}

}
