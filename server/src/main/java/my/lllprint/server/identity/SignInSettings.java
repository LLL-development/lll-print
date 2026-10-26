package my.lllprint.server.identity;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * The two settings signing in needs.
 *
 * <p>The secret is never committed. It lives in
 * {@code application-local.properties}, which is ignored by git, and in the
 * running machine environment (SEC-4). The server refuses to start without one,
 * rather than quietly inventing a weak one.
 */
@ConfigurationProperties(prefix = "lllprint.sign-in")
public record SignInSettings(String tokenSecret, Duration sessionLength) {

	/** Short enough that a forgotten phone stops being useful the same day (SEC-6). */
	private static final Duration DEFAULT_SESSION_LENGTH = Duration.ofHours(12);

	private static final int SHORTEST_USEFUL_SECRET = 32;

	public SignInSettings {
		if (tokenSecret == null || tokenSecret.strip().length() < SHORTEST_USEFUL_SECRET) {
			throw new IllegalStateException(
					"lllprint.sign-in.token-secret is missing or too short. It must be at least "
							+ SHORTEST_USEFUL_SECRET
							+ " characters and it belongs in application-local.properties, which is not committed.");
		}
		if (sessionLength == null) {
			sessionLength = DEFAULT_SESSION_LENGTH;
		}
		if (sessionLength.isNegative() || sessionLength.isZero()) {
			throw new IllegalStateException("lllprint.sign-in.session-length must be longer than nothing");
		}
	}

}
