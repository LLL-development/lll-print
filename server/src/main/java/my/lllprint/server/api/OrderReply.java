package my.lllprint.server.api;

import java.time.LocalDate;
import java.util.List;

import my.lllprint.server.order.OrderService;
import my.lllprint.server.order.QuotationGarmentGroup;
import my.lllprint.server.order.QuotationSize;

/**
 * An order as the screens see it: what was typed, and the working out behind
 * the total (FR-1.7).
 *
 * <p>All money is whole sen. The screen turns it into RM for a person; nothing
 * fractional ever leaves the server (FR-1.8, NFR-2.4).
 */
public record OrderReply(
		Long id,
		String number,
		String state,
		String jobTitle,
		Long contactId,
		String customerName,
		LocalDate dateWanted,
		String sourceNote,
		long pieces,
		long basePricePerPieceSen,
		long itemSubtotalSen,
		long shippingChargeSen,
		long grandTotalSen,
		List<Line> workings,
		List<Specification> specifications,
		List<GarmentGroup> garmentGroups,
		List<Charge> charges,
		Long version) {

	/** One line of the working out: what it is, how many, the price each, the result. */
	public record Line(String part, String what, long howMany, long eachSen, long amountSen) {
	}

	public record Specification(Long id, String kind, Long catalogueOptionId, String name, long priceSen,
			String chargedPer) {
	}

	public record Chosen(Long catalogueOptionId, String name, Long priceSen, String chargedPer) {
	}

	public record GarmentGroup(Long id, Chosen neck, Chosen sleeve, String note, List<Size> sizes) {
	}

	public record Size(Long id, Long catalogueOptionId, String name, long priceSen, int quantity, String note) {
	}

	public record Charge(Long id, String name, long amountSen, String chargedPer) {
	}

	public static OrderReply of(OrderService.SavedOrder saved) {
		var quotation = saved.quotation();

		List<Line> workings = saved.workings().lines().stream()
				.map(line -> new Line(line.kind().name().toLowerCase(), line.what(), line.howMany(),
						line.eachSen(), line.amountSen()))
				.toList();

		List<Specification> specifications = saved.specifications().stream()
				.map(specification -> new Specification(specification.id(),
						specification.kind().name().toLowerCase(), specification.catalogueOptionId(),
						specification.name(), specification.priceSen(), specification.chargedPer().code()))
				.toList();

		List<GarmentGroup> groups = saved.garmentGroups().stream()
				.map(group -> new GarmentGroup(group.id(), chosen(group.neck()), chosen(group.sleeve()),
						group.note(), sizesOf(saved, group)))
				.toList();

		List<Charge> charges = saved.charges().stream()
				.map(charge -> new Charge(charge.id(), charge.name(), charge.amountSen(),
						charge.chargedPer().code()))
				.toList();

		return new OrderReply(
				quotation.id(),
				quotation.number(),
				quotation.state().code(),
				quotation.jobTitle(),
				quotation.contactId(),
				quotation.customerName(),
				quotation.dateWanted(),
				quotation.sourceNote(),
				saved.workings().pieces(),
				quotation.pricePerPieceSen(),
				quotation.itemSubtotalSen(),
				quotation.shippingChargeSen(),
				quotation.grandTotalSen(),
				workings,
				specifications,
				groups,
				charges,
				quotation.version());
	}

	private static List<Size> sizesOf(OrderService.SavedOrder saved, QuotationGarmentGroup group) {
		List<QuotationSize> found = saved.sizesByGroup().getOrDefault(group.id(), List.of());
		return found.stream()
				.map(size -> new Size(size.id(), size.chosen().catalogueOptionId(), size.name(), size.priceSen(),
						size.quantity(), size.note()))
				.toList();
	}

	private static Chosen chosen(my.lllprint.server.order.OrderToPrice.Chosen option) {
		return option == null ? null
				: new Chosen(option.catalogueOptionId(), option.name(), option.priceSen(),
						option.chargedPer() == null ? null : option.chargedPer().code());
	}

	/** Used by the list, where the levels and the working out are not wanted. */
	public static OrderReply summaryOf(my.lllprint.server.order.Quotation quotation) {
		return new OrderReply(quotation.id(), quotation.number(), quotation.state().code(), quotation.jobTitle(),
				quotation.contactId(), quotation.customerName(), quotation.dateWanted(), quotation.sourceNote(),
				0, quotation.pricePerPieceSen(), quotation.itemSubtotalSen(), quotation.shippingChargeSen(),
				quotation.grandTotalSen(), List.of(), List.of(), List.of(), List.of(), quotation.version());
	}

}
