package my.lllprint.server.order;

import java.util.List;

/**
 * What the order comes to, and every line it came from.
 *
 * <p>The screen shows these lines as the running total builds (FR-1.7). The
 * server works them out again on every read and every write, and refuses a
 * total that does not match what was sent (SEC-7).
 *
 * <p>There is no tax figure and no discount figure here, because there is no
 * tax field and no discount field anywhere in this system (FR-1.9).
 */
public record PriceWorkings(
		List<PricedLine> lines,
		long pieces,
		long itemSubtotalSen,
		long shippingChargeSen,
		long grandTotalSen) {

	public PriceWorkings {
		lines = lines == null ? List.of() : List.copyOf(lines);
	}

}
