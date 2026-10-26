package my.lllprint.server.api;

import java.util.Map;

/**
 * Thrown wherever a request is refused. Carries which of the named refusals it
 * was, a plain sentence, and the fields at fault where there are any.
 */
public class Refused extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private final Refusal refusal;

	private final Map<String, String> fields;

	public Refused(Refusal refusal, String message) {
		this(refusal, message, Map.of());
	}

	public Refused(Refusal refusal, String message, Map<String, String> fields) {
		super(message);
		this.refusal = refusal;
		this.fields = fields == null ? Map.of() : Map.copyOf(fields);
	}

	public Refusal refusal() {
		return refusal;
	}

	public Map<String, String> fields() {
		return fields;
	}

	public static Refused notSignedIn() {
		return new Refused(Refusal.NOT_SIGNED_IN, "Sign in first.");
	}

	public static Refused notAllowed() {
		return new Refused(Refusal.NOT_ALLOWED, "This account is not allowed to do that.");
	}

}
