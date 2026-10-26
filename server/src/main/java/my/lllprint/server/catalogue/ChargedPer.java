package my.lllprint.server.catalogue;

import java.util.Optional;

/**
 * Whether an option is charged for every piece, or once for the whole order
 * (FR-1.6, FR-12.2). There is nothing else.
 */
public enum ChargedPer {

	PIECE("piece"),
	ORDER("order");

	private final String code;

	ChargedPer(String code) {
		this.code = code;
	}

	public String code() {
		return code;
	}

	public static Optional<ChargedPer> find(String code) {
		for (ChargedPer chargedPer : values()) {
			if (chargedPer.code.equals(code)) {
				return Optional.of(chargedPer);
			}
		}
		return Optional.empty();
	}

	public static ChargedPer ofCode(String code) {
		return find(code).orElseThrow(() -> new IllegalArgumentException("not a way of charging: " + code));
	}

}
