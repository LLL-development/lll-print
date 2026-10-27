package my.lllprint.server.api;

import my.lllprint.server.catalogue.CatalogueOption;

/**
 * One option button as the screens see it.
 *
 * <p>The price is whole sen as a whole number: RM 28.00 is 2800, and Kids at
 * minus RM 2.00 is -200. Never a decimal and never a string (FR-1.8, NFR-2.4).
 *
 * <p>The shop is not in here. A screen never needs telling which shop it is
 * looking at, because it can only ever be its own (SEC-2).
 */
public record CatalogueOptionReply(
		Long id,
		String kind,
		String name,
		long standardPriceSen,
		String chargedPer,
		boolean offered,
		int sortOrder,
		Long version) {

	public static CatalogueOptionReply of(CatalogueOption option) {
		return new CatalogueOptionReply(
				option.id(),
				option.kind().code(),
				option.name(),
				option.standardPriceSen(),
				option.chargedPer().code(),
				option.isOffered(),
				option.sortOrder(),
				option.version());
	}

}
