package my.lllprint.server.catalogue;

import java.util.Optional;

/**
 * The seven separate lists of options the shop offers (FR-12.1).
 *
 * <p>The lists are kept apart and are never merged into one list of
 * combinations. The same seven are a check constraint on
 * {@code catalogue_option.kind}.
 */
public enum OptionKind {

	NECK("neck"),
	SLEEVE("sleeve"),
	SIZE("size"),
	MATERIAL("material"),
	PRINTING_METHOD("printing_method"),
	PRINT_LOCATION("print_location"),
	NAMES_AND_NUMBERS("names_and_numbers");

	private final String code;

	OptionKind(String code) {
		this.code = code;
	}

	/** The value as the database stores it, and as the API uses it. */
	public String code() {
		return code;
	}

	public static Optional<OptionKind> find(String code) {
		for (OptionKind kind : values()) {
			if (kind.code.equals(code)) {
				return Optional.of(kind);
			}
		}
		return Optional.empty();
	}

	public static OptionKind ofCode(String code) {
		return find(code).orElseThrow(() -> new IllegalArgumentException("not a kind of option: " + code));
	}

}
