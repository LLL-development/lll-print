package my.lllprint.server.order;

/**
 * One line of the working out, with its own arithmetic showing (FR-1.7).
 *
 * <p>A total with no workings shown is not acceptable, so every figure that
 * affects the total appears here as a line saying what it is, how many it
 * applies to, the price each, and the result.
 *
 * <p>All money is whole sen. RM 28.00 is 2800.
 */
public record PricedLine(Kind kind, String what, long howMany, long eachSen, long amountSen) {

	/** Which part of the order a line came from, so a screen can group them the way the form is typed. */
	public enum Kind {

		/** The garment itself, before any option. Typed by Admin (FR-1.4a). */
		PRICE_PER_PIECE,

		/** Level one: material, printing method, print location, typed once for the whole order (FR-1.3). */
		SPECIFICATION,

		/** Level two: the neck and the sleeve chosen on a garment group. */
		GARMENT_GROUP_OPTION,

		/** Level three: the size chosen on a size entry. */
		SIZE_OPTION,

		/** A charge Admin typed on the whole order, such as artwork setup (FR-1.6a). */
		ORDER_CHARGE

	}

	static PricedLine of(Kind kind, String what, long howMany, long eachSen) {
		// Whole sen times a whole quantity, so no fraction of a sen can arise
		// here. FR-1.8's rounding rule has nothing to round.
		return new PricedLine(kind, what, howMany, eachSen, howMany * eachSen);
	}

}
