package my.lllprint.server.api;

import org.springframework.http.HttpStatus;

/**
 * The small fixed set of refusals, decided up front (SDD section 6).
 *
 * <p>Every refusal the API ever gives is one of these, and the reply names which
 * one, in a form the screen can act on rather than only show. A refusal never
 * carries another shop's data, a stack trace, or anything about whether a record
 * exists elsewhere.
 */
public enum Refusal {

	/** No valid token. */
	NOT_SIGNED_IN("not_signed_in", HttpStatus.UNAUTHORIZED),

	/** Signed in, but the account lacks the grant, or the action is Admin alone (FR-10.3, FR-10.5). */
	NOT_ALLOWED("not_allowed", HttpStatus.FORBIDDEN),

	/**
	 * The record does not exist, or belongs to another shop. The two are answered
	 * identically, so nothing is revealed (SEC-2).
	 */
	NOT_FOUND("not_found", HttpStatus.NOT_FOUND),

	/** The request is the wrong shape, or a value is out of range. Names the fields. */
	INVALID("invalid", HttpStatus.BAD_REQUEST),

	/** The record has moved on since it was read (SEC-8). */
	CHANGED_BY_SOMEONE_ELSE("changed_by_someone_else", HttpStatus.CONFLICT),

	/** The record is not in a state where this can happen (SEC-7). */
	NOT_POSSIBLE_NOW("not_possible_now", HttpStatus.CONFLICT),

	/** The same write has already been settled (SEC-8). */
	ALREADY_DONE("already_done", HttpStatus.CONFLICT),

	/** The screen may try again. */
	TOO_MANY_REQUESTS("too_many_requests", HttpStatus.TOO_MANY_REQUESTS),

	/** The screen may try again. */
	TEMPORARILY_UNAVAILABLE("temporarily_unavailable", HttpStatus.SERVICE_UNAVAILABLE);

	private final String code;

	private final HttpStatus status;

	Refusal(String code, HttpStatus status) {
		this.code = code;
		this.status = status;
	}

	public String code() {
		return code;
	}

	public HttpStatus status() {
		return status;
	}

}
