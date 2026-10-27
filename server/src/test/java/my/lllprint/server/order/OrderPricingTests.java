package my.lllprint.server.order;

import java.util.List;

import my.lllprint.server.api.Refused;
import my.lllprint.server.catalogue.ChargedPer;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The money arithmetic, tested on its own with nothing else running (NFR-3.2).
 *
 * <p>Priced the way the shop prices: the cloth carries the base price per piece
 * for the plainest garment, roundneck and short sleeve, and anything different
 * adds its own amount on top (FR-1.4a).
 *
 * <p>This is check C-1 in SDD section 6: the real order must reach
 * RM 1,734.00.
 */
class OrderPricingTests {

	private static OrderToPrice.Chosen option(String name, long priceSen, ChargedPer chargedPer) {
		return new OrderToPrice.Chosen(null, name, priceSen, chargedPer);
	}

	private static OrderToPrice.Specification cloth(String name, long priceSen) {
		return new OrderToPrice.Specification(OrderToPrice.SpecificationKind.MATERIAL,
				option(name, priceSen, ChargedPer.PIECE));
	}

	private static OrderToPrice.SizeEntry size(String name, long priceSen, long quantity) {
		return new OrderToPrice.SizeEntry(option(name, priceSen, ChargedPer.PIECE), quantity, null);
	}

	private static OrderToPrice.GarmentGroup group(OrderToPrice.Chosen neck, OrderToPrice.Chosen sleeve,
			List<OrderToPrice.SizeEntry> sizes) {
		return new OrderToPrice.GarmentGroup(neck, sleeve, null, sizes);
	}

	/** Four size entries adding up to the count given, as the real order's groups do. */
	private static List<OrderToPrice.SizeEntry> sizes(long small, long medium, long large, long extraLarge) {
		return List.of(size("S", 0, small), size("M", 0, medium), size("L", 0, large),
				size("XL", 0, extraLarge));
	}

	/**
	 * KEM PENGAKAP: EYELAT 170gsm, 55 helai across five garment groups and twenty
	 * size entries, plus artwork setup at RM 50.00 once. The total is
	 * RM 1,734.00.
	 *
	 * <p>**The option lines are a reconstruction.** The documents record the
	 * total, the 55 helai, the RM 28.00 the cloth carries and the RM 50.00, but
	 * never which options made up the remaining RM 144.00. These are a set that
	 * fits those recorded figures, not a copy of the shop's own prices.
	 */
	private static OrderToPrice theRealOrder() {
		OrderToPrice.Chosen collarZip = option("Collar Zip", 300, ChargedPer.PIECE);
		// Charged once for the whole order even though two groups carry it.
		OrderToPrice.Chosen longSleeve = option("Long sleeve", 400, ChargedPer.ORDER);

		return new OrderToPrice(
				null,
				List.of(
						cloth("EYELAT 170gsm", 2800),
						new OrderToPrice.Specification(OrderToPrice.SpecificationKind.PRINTING_METHOD,
								option("Sublimation", 200, ChargedPer.PIECE))),
				List.of(
						group(collarZip, longSleeve, sizes(3, 4, 2, 1)),
						group(null, longSleeve, sizes(2, 5, 3, 1)),
						group(null, null, sizes(3, 4, 3, 1)),
						group(null, null, sizes(2, 5, 3, 1)),
						group(null, null, sizes(3, 5, 3, 1))),
				List.of(new OrderToPrice.OrderCharge("Artwork setup", 5000, ChargedPer.ORDER)),
				0);
	}

	@Test
	void the_real_order_comes_to_one_thousand_seven_hundred_and_thirty_four_ringgit() {
		PriceWorkings workings = OrderPricing.workOut(theRealOrder());

		assertThat(workings.pieces()).isEqualTo(55);
		assertThat(workings.grandTotalSen()).isEqualTo(173400);
	}

	@Test
	void the_cloth_is_the_base_line_and_is_never_charged_a_second_time() {
		PriceWorkings workings = OrderPricing.workOut(theRealOrder());

		PricedLine base = workings.lines().get(0);
		assertThat(base.kind()).isEqualTo(PricedLine.Kind.PRICE_PER_PIECE);
		assertThat(base.what()).isEqualTo("EYELAT 170gsm");
		assertThat(base.howMany()).isEqualTo(55);
		assertThat(base.eachSen()).isEqualTo(2800);
		assertThat(base.amountSen()).isEqualTo(154000);

		// The cloth appears once in the whole working out, not twice.
		assertThat(workings.lines().stream().filter(line -> line.what().equals("EYELAT 170gsm")).count())
				.isEqualTo(1);
	}

	@Test
	void a_plain_shirt_costs_what_the_cloth_costs_and_a_polo_long_sleeve_adds_on_top() {
		// 150gsm at RM 11.00, 170gsm at RM 13.00, Polo adds RM 4.00, Long sleeve
		// adds RM 3.00 (FR-1.4a).
		OrderToPrice plainIn150 = new OrderToPrice(null, List.of(cloth("150gsm", 1100)),
				List.of(group(option("Roundneck", 0, ChargedPer.PIECE), option("Short sleeve", 0, ChargedPer.PIECE),
						List.of(size("M", 0, 1)))),
				List.of(), 0);

		OrderToPrice poloLongIn170 = new OrderToPrice(null, List.of(cloth("170gsm", 1300)),
				List.of(group(option("Polo", 400, ChargedPer.PIECE), option("Long sleeve", 300, ChargedPer.PIECE),
						List.of(size("M", 0, 1)))),
				List.of(), 0);

		assertThat(OrderPricing.workOut(plainIn150).grandTotalSen()).isEqualTo(1100);
		assertThat(OrderPricing.workOut(poloLongIn170).grandTotalSen()).isEqualTo(2000);
	}

	@Test
	void roundneck_and_short_sleeve_are_shown_at_nothing_rather_than_left_out() {
		OrderToPrice order = new OrderToPrice(null, List.of(cloth("170gsm", 1300)),
				List.of(group(option("Roundneck", 0, ChargedPer.PIECE), option("Short sleeve", 0, ChargedPer.PIECE),
						List.of(size("M", 0, 2)))),
				List.of(), 0);

		PriceWorkings workings = OrderPricing.workOut(order);

		// FR-1.9. A free option must look decided, not forgotten.
		assertThat(workings.lines()).anySatisfy(line -> {
			assertThat(line.what()).isEqualTo("Roundneck");
			assertThat(line.amountSen()).isZero();
		});
		assertThat(workings.lines()).anySatisfy(line -> {
			assertThat(line.what()).isEqualTo("Short sleeve");
			assertThat(line.amountSen()).isZero();
		});
	}

	@Test
	void a_one_off_price_typed_for_this_order_is_used_instead_of_the_cloths_own() {
		// Step one of FR-1.5: a price Admin typed for this order wins.
		OrderToPrice order = new OrderToPrice(3000L, List.of(cloth("EYELAT 170gsm", 2800)),
				List.of(group(null, null, List.of(size("M", 0, 10)))), List.of(), 0);

		PriceWorkings workings = OrderPricing.workOut(order);

		assertThat(workings.lines().get(0).eachSen()).isEqualTo(3000);
		assertThat(workings.grandTotalSen()).isEqualTo(30000);
	}

	@Test
	void every_line_shows_its_own_arithmetic_and_they_add_up_to_the_total() {
		PriceWorkings workings = OrderPricing.workOut(theRealOrder());

		// FR-1.7. Each line multiplies out on its own, and the total is nothing
		// more than those lines added together.
		assertThat(workings.lines()).allSatisfy(
				line -> assertThat(line.amountSen()).isEqualTo(line.howMany() * line.eachSen()));
		assertThat(workings.lines().stream().mapToLong(PricedLine::amountSen).sum())
				.isEqualTo(workings.itemSubtotalSen());
	}

	@Test
	void an_option_charged_once_for_the_whole_order_is_charged_once_however_many_groups_carry_it() {
		PriceWorkings workings = OrderPricing.workOut(theRealOrder());

		List<PricedLine> longSleeve = workings.lines().stream().filter(line -> line.what().equals("Long sleeve"))
				.toList();
		assertThat(longSleeve).hasSize(1);
		assertThat(longSleeve.get(0).amountSen()).isEqualTo(400);
	}

	@Test
	void a_per_piece_option_on_a_garment_group_counts_that_group_only() {
		PriceWorkings workings = OrderPricing.workOut(theRealOrder());

		// Collar Zip is on the first group, which is ten pieces, not all 55.
		PricedLine collarZip = workings.lines().stream().filter(line -> line.what().equals("Collar Zip"))
				.findFirst().orElseThrow();
		assertThat(collarZip.howMany()).isEqualTo(10);
		assertThat(collarZip.amountSen()).isEqualTo(3000);
	}

	@Test
	void an_option_priced_below_zero_brings_the_total_down() {
		// Kids at minus RM 2.00 (FR-1.9, FR-12.2, check C-2).
		OrderToPrice order = new OrderToPrice(null, List.of(cloth("170gsm", 2800)),
				List.of(group(null, null, List.of(size("Kids", -200, 10)))), List.of(), 0);

		PriceWorkings workings = OrderPricing.workOut(order);

		assertThat(workings.itemSubtotalSen()).isEqualTo(10 * 2800 - 10 * 200);
	}

	@Test
	void a_typed_charge_below_zero_is_refused_because_that_would_be_a_discount() {
		OrderToPrice order = new OrderToPrice(null, List.of(cloth("170gsm", 2800)),
				List.of(group(null, null, List.of(size("M", 0, 1)))),
				List.of(new OrderToPrice.OrderCharge("Goodwill", -500, ChargedPer.ORDER)), 0);

		assertThatThrownBy(() -> OrderPricing.workOut(order))
				.isInstanceOf(Refused.class)
				.hasMessageContaining("below zero");
	}

	@Test
	void a_base_price_below_zero_is_refused() {
		OrderToPrice order = new OrderToPrice(-1L, List.of(cloth("170gsm", 2800)),
				List.of(group(null, null, List.of(size("M", 0, 1)))), List.of(), 0);

		assertThatThrownBy(() -> OrderPricing.workOut(order)).isInstanceOf(Refused.class);
	}

	@Test
	void a_size_entry_with_no_quantity_is_refused() {
		OrderToPrice order = new OrderToPrice(null, List.of(cloth("170gsm", 2800)),
				List.of(group(null, null, List.of(size("M", 0, 0)))), List.of(), 0);

		assertThatThrownBy(() -> OrderPricing.workOut(order)).isInstanceOf(Refused.class);
	}

	@Test
	void an_order_with_no_cloth_chosen_yet_prices_the_garment_at_nothing() {
		// A draft being typed. FR-1.11 stops it becoming a quotation, but the
		// running total still has to show something rather than fall over.
		OrderToPrice order = new OrderToPrice(null, List.of(),
				List.of(group(null, null, List.of(size("M", 0, 4)))), List.of(), 0);

		PriceWorkings workings = OrderPricing.workOut(order);

		assertThat(workings.lines().get(0).what()).isEqualTo("Base price per piece");
		assertThat(workings.grandTotalSen()).isZero();
	}

	@Test
	void a_charge_for_every_piece_is_multiplied_by_every_piece_on_the_order() {
		OrderToPrice order = new OrderToPrice(null, List.of(),
				List.of(group(null, null, List.of(size("M", 0, 7)))),
				List.of(new OrderToPrice.OrderCharge("Packing", 100, ChargedPer.PIECE)), 0);

		assertThat(OrderPricing.workOut(order).itemSubtotalSen()).isEqualTo(700);
	}

	@Test
	void delivery_is_added_after_the_items_and_never_mixed_into_them() {
		OrderToPrice order = new OrderToPrice(null, List.of(cloth("170gsm", 2800)),
				List.of(group(null, null, List.of(size("M", 0, 10)))), List.of(), 1500);

		PriceWorkings workings = OrderPricing.workOut(order);

		assertThat(workings.itemSubtotalSen()).isEqualTo(28000);
		assertThat(workings.shippingChargeSen()).isEqualTo(1500);
		assertThat(workings.grandTotalSen()).isEqualTo(29500);
	}

	@Test
	void nothing_in_the_working_out_is_a_tax_or_a_discount() {
		PriceWorkings workings = OrderPricing.workOut(theRealOrder());

		// FR-1.9. There is no tax field and no discount field anywhere, so there
		// is no kind of line that could carry one.
		assertThat(workings.lines()).allSatisfy(line -> assertThat(line.kind())
				.isIn(PricedLine.Kind.PRICE_PER_PIECE, PricedLine.Kind.SPECIFICATION,
						PricedLine.Kind.GARMENT_GROUP_OPTION, PricedLine.Kind.SIZE_OPTION,
						PricedLine.Kind.ORDER_CHARGE));
	}

	@Test
	void an_order_with_nothing_typed_on_it_comes_to_nothing() {
		PriceWorkings workings = OrderPricing.workOut(new OrderToPrice(null, List.of(), List.of(), List.of(), 0));

		assertThat(workings.pieces()).isZero();
		assertThat(workings.grandTotalSen()).isZero();
	}

}
