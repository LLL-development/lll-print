package my.lllprint.server.order;

import java.util.List;
import java.util.Optional;

import my.lllprint.server.catalogue.ChargedPer;

/**
 * An order as the money calculator sees it: the three levels the form is typed
 * in, plus any typed order charges.
 *
 * <p>Nothing here knows about the database, the browser or Spring. It is the
 * one boundary worth being strict about, because this is where a mistake costs
 * the shop money rather than just looking wrong (NFR-3.2).
 *
 * <p>Every price is whole sen, and every price that came from the catalogue is
 * the price **as it was shown**, never looked up again (FR-2.2, FR-12.7).
 */
public record OrderToPrice(
		Long onePriceOverrideSen,
		List<Specification> specifications,
		List<GarmentGroup> garmentGroups,
		List<OrderCharge> charges,
		long shippingChargeSen) {

	public OrderToPrice {
		specifications = specifications == null ? List.of() : List.copyOf(specifications);
		garmentGroups = garmentGroups == null ? List.of() : List.copyOf(garmentGroups);
		charges = charges == null ? List.of() : List.copyOf(charges);
	}

	/** Level one, typed once for the whole order (FR-1.3). */
	public enum SpecificationKind {

		/**
		 * The cloth. It carries the base price per piece: the plainest garment,
		 * roundneck and short sleeve, costs what the cloth costs (FR-1.4a).
		 */
		MATERIAL,

		PRINTING_METHOD,

		PRINT_LOCATION

	}

	/** One of the order's specifications, and the option chosen for it. */
	public record Specification(SpecificationKind kind, Chosen chosen) {
	}

	/**
	 * An option that was chosen, as it was shown: where it came from, what it was
	 * called, what it cost, and whether that cost is for every piece or once for
	 * the whole order.
	 *
	 * <p>The price may be below zero. Kids at minus RM 2.00 is -200, and that is
	 * how a thing worth less is expressed (FR-1.9, FR-12.2).
	 */
	public record Chosen(Long catalogueOptionId, String name, long priceSen, ChargedPer chargedPer) {
	}

	/**
	 * Level two. Its neck and its sleeve, and the size entries under it.
	 *
	 * <p>A neck or a sleeve that differs from the plain garment adds its own
	 * amount on top of the cloth: Polo adds RM 4.00, Long sleeve adds RM 3.00.
	 * Roundneck and short sleeve are options priced at RM 0.00, and are still
	 * shown at RM 0.00 (FR-1.4a, FR-1.9).
	 *
	 * <p>The note carries no price. It is free text for Admin to read, such as
	 * {@code readymade} (D-E).
	 */
	public record GarmentGroup(Chosen neck, Chosen sleeve, String note, List<SizeEntry> sizes) {

		public GarmentGroup {
			sizes = sizes == null ? List.of() : List.copyOf(sizes);
		}

		public long pieces() {
			return sizes.stream().mapToLong(SizeEntry::quantity).sum();
		}

	}

	/** Level three. One size and how many of it, with a free-text note for one piece. */
	public record SizeEntry(Chosen size, long quantity, String note) {
	}

	/**
	 * A charge Admin typed on the whole order, such as artwork setup at RM 50.00
	 * (FR-1.6a).
	 *
	 * <p>It is never below zero. A negative typed line would be the discount
	 * FR-1.9 forbids, and MySQL refuses one too (D-Y).
	 */
	public record OrderCharge(String name, long amountSen, ChargedPer chargedPer) {
	}

	/** Every piece on the order. 55 helai on the real order. */
	public long pieces() {
		return garmentGroups.stream().mapToLong(GarmentGroup::pieces).sum();
	}

	/** The cloth, which is what the base price per piece comes from (FR-1.4a). */
	public Optional<Chosen> cloth() {
		return specifications.stream()
				.filter(specification -> specification.kind() == SpecificationKind.MATERIAL)
				.map(Specification::chosen)
				.filter(chosen -> chosen != null)
				.findFirst();
	}

}
