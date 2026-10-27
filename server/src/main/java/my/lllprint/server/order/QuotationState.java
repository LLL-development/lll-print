package my.lllprint.server.order;

import java.util.Optional;

/**
 * What has happened to a quotation so far (FR-2.1).
 *
 * <p>A draft is the order still being typed. Once sent, the priced columns are
 * frozen and a change becomes a new quotation rather than an edit (FR-2.7,
 * SEC-9a).
 */
public enum QuotationState {

	DRAFT("draft"),
	SENT("sent"),
	AGREED("agreed"),
	CONVERTED("converted"),
	CANCELLED("cancelled");

	private final String code;

	QuotationState(String code) {
		this.code = code;
	}

	public String code() {
		return code;
	}

	public static Optional<QuotationState> find(String code) {
		for (QuotationState state : values()) {
			if (state.code.equals(code)) {
				return Optional.of(state);
			}
		}
		return Optional.empty();
	}

	public static QuotationState ofCode(String code) {
		return find(code).orElseThrow(() -> new IllegalArgumentException("not a quotation state: " + code));
	}

}
