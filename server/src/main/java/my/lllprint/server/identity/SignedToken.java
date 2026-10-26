package my.lllprint.server.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

/**
 * Makes and checks the token a signed-in screen sends back on every request.
 *
 * <p>The token is two parts joined by a dot: a long random value, and a
 * signature of that value made with the server's own secret. The signature lets a
 * made-up token be refused without touching the database at all. The random
 * part is then looked up, and the session row decides whether it is still good
 * (SEC-6).
 *
 * <p>The token carries who is asking and nothing else. It carries no role, no
 * grant and no shop, because all three are read from the account on every
 * request (D-AF, SEC-2).
 */
@Component
public class SignedToken {

	private static final String ALGORITHM = "HmacSHA256";

	private static final int RANDOM_BYTES = 32;

	private final SecureRandom random = new SecureRandom();

	private final byte[] secret;

	public SignedToken(SignInSettings settings) {
		this.secret = settings.tokenSecret().strip().getBytes(StandardCharsets.UTF_8);
	}

	/** A fresh token, and the hash of it that is all the database ever holds. */
	public Issued issue() {
		byte[] bytes = new byte[RANDOM_BYTES];
		random.nextBytes(bytes);
		String value = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		return new Issued(value + "." + sign(value), hashOf(value));
	}

	/**
	 * Checks the signature and returns the hash to look the session up by.
	 *
	 * <p>Empty means the token was not made by this server, so nothing is read
	 * from the database for it.
	 */
	public Optional<String> hashOfValidToken(String token) {
		if (token == null) {
			return Optional.empty();
		}
		int dot = token.indexOf('.');
		if (dot <= 0 || dot == token.length() - 1 || token.indexOf('.', dot + 1) >= 0) {
			return Optional.empty();
		}
		String value = token.substring(0, dot);
		String signature = token.substring(dot + 1);
		byte[] offered = signature.getBytes(StandardCharsets.UTF_8);
		byte[] expected = sign(value).getBytes(StandardCharsets.UTF_8);
		if (!MessageDigest.isEqual(offered, expected)) {
			return Optional.empty();
		}
		return Optional.of(hashOf(value));
	}

	private String sign(String value) {
		try {
			Mac mac = Mac.getInstance(ALGORITHM);
			mac.init(new SecretKeySpec(secret, ALGORITHM));
			return Base64.getUrlEncoder().withoutPadding()
					.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException | java.security.InvalidKeyException ex) {
			throw new IllegalStateException("the server cannot sign a token: " + ex.getMessage(), ex);
		}
	}

	private String hashOf(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("the server cannot hash a token: " + ex.getMessage(), ex);
		}
	}

	/** The token to hand to the screen, and the hash to store. */
	public record Issued(String token, String tokenHash) {
	}

}
