package my.lllprint.server.order;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import my.lllprint.server.api.Refusal;
import my.lllprint.server.api.Refused;
import my.lllprint.server.catalogue.ChargedPer;

/**
 * Works out what an order comes to, in whole sen, showing every line
 * (FR-1.7, FR-1.8).
 *
 * <p>This class has no database, no Spring and no browser in it, so the
 * arithmetic can be tested on its own (NFR-3.2). It is also the only place the
 * arithmetic exists: a total worked out in a browser can be changed in that
 * browser, so the server works it out again every time (SEC-7).
 *
 * <p>The order it adds things up in is the order the form is typed in: the
 * garment itself, then the rest of the specifications, then each garment group,
 * then its sizes, then the typed charges.
 */
public final class OrderPricing {

	private OrderPricing() {
	}

	public static PriceWorkings workOut(OrderToPrice order) {
		List<PricedLine> lines = new ArrayList<>();
		long pieces = order.pieces();

		lines.add(basePricePerPiece(order, pieces));

		// An option charged once for the whole order is charged once, however
		// many places it was chosen in. Charging it again for each garment group
		// would not be "once for the whole order" (FR-1.6).
		Set<String> alreadyChargedOnce = new LinkedHashSet<>();

		for (OrderToPrice.Specification specification : order.specifications()) {
			// The cloth is already the base line above. Adding it again here
			// would charge the garment twice (FR-1.4a).
			if (specification.kind() == OrderToPrice.SpecificationKind.MATERIAL) {
				continue;
			}
			addOption(lines, PricedLine.Kind.SPECIFICATION, specification.chosen(), pieces, alreadyChargedOnce);
		}

		for (OrderToPrice.GarmentGroup group : order.garmentGroups()) {
			long piecesInGroup = group.pieces();
			addOption(lines, PricedLine.Kind.GARMENT_GROUP_OPTION, group.neck(), piecesInGroup, alreadyChargedOnce);
			addOption(lines, PricedLine.Kind.GARMENT_GROUP_OPTION, group.sleeve(), piecesInGroup, alreadyChargedOnce);
			for (OrderToPrice.SizeEntry size : group.sizes()) {
				if (size.quantity() <= 0) {
					throw new Refused(Refusal.INVALID, "A size entry needs a quantity above zero.",
							Map.of("quantity", "Type how many."));
				}
				addOption(lines, PricedLine.Kind.SIZE_OPTION, size.size(), size.quantity(), alreadyChargedOnce);
			}
		}

		for (OrderToPrice.OrderCharge charge : order.charges()) {
			if (charge.amountSen() < 0) {
				// A negative typed line is the discount FR-1.9 forbids. MySQL
				// refuses one as well, so this is the rule twice over (D-Y).
				throw new Refused(Refusal.INVALID, "A charge cannot be below zero.",
						Map.of("amountSen", "Type zero or more."));
			}
			long howMany = charge.chargedPer() == ChargedPer.PIECE ? pieces : 1;
			lines.add(PricedLine.of(PricedLine.Kind.ORDER_CHARGE, charge.name(), howMany, charge.amountSen()));
		}

		long itemSubtotal = lines.stream().mapToLong(PricedLine::amountSen).sum();
		long shipping = order.shippingChargeSen();
		return new PriceWorkings(List.copyOf(lines), pieces, itemSubtotal, shipping, itemSubtotal + shipping);
	}

	/**
	 * The garment itself, as its own line: EYELAT 170gsm, 55 helai x RM 28.00 =
	 * RM 1,540.00.
	 *
	 * <p>The price is the cloth's, because the plainest garment — roundneck,
	 * short sleeve — costs what the cloth costs. Admin may type a one-off price
	 * over it for this order, which is step one of FR-1.5 (FR-1.4a).
	 */
	private static PricedLine basePricePerPiece(OrderToPrice order, long pieces) {
		Optional<OrderToPrice.Chosen> cloth = order.cloth();
		long baseSen = order.onePriceOverrideSen() != null
				? order.onePriceOverrideSen()
				: cloth.map(OrderToPrice.Chosen::priceSen).orElse(0L);

		if (baseSen < 0) {
			// FR-1.4a. The garment's own price is zero or above. A thing worth
			// less is an option priced below zero, never a negative garment.
			throw new Refused(Refusal.INVALID, "The base price per piece cannot be below zero.",
					Map.of("onePriceOverrideSen", "Type zero or more."));
		}

		String what = cloth.map(OrderToPrice.Chosen::name).orElse("Base price per piece");
		return PricedLine.of(PricedLine.Kind.PRICE_PER_PIECE, what, pieces, baseSen);
	}

	/**
	 * Adds one chosen option as its own line.
	 *
	 * <p>An option priced at RM 0.00 still gets a line at RM 0.00, so that a free
	 * option looks decided rather than forgotten. Roundneck and short sleeve are
	 * exactly that (FR-1.9, FR-1.4a).
	 */
	private static void addOption(List<PricedLine> lines, PricedLine.Kind kind, OrderToPrice.Chosen chosen,
			long piecesItAppliesTo, Set<String> alreadyChargedOnce) {
		if (chosen == null) {
			return;
		}
		if (chosen.chargedPer() == ChargedPer.ORDER) {
			if (!alreadyChargedOnce.add(onceKey(chosen))) {
				return;
			}
			lines.add(PricedLine.of(kind, chosen.name(), 1, chosen.priceSen()));
			return;
		}
		lines.add(PricedLine.of(kind, chosen.name(), piecesItAppliesTo, chosen.priceSen()));
	}

	/** The same catalogue option, wherever it was chosen. Falls back to the name it was shown under. */
	private static String onceKey(OrderToPrice.Chosen chosen) {
		return chosen.catalogueOptionId() == null ? "name:" + chosen.name() : "option:" + chosen.catalogueOptionId();
	}

}
