package my.lllprint.server.order;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import my.lllprint.server.api.Refusal;
import my.lllprint.server.api.Refused;
import my.lllprint.server.catalogue.CatalogueOption;
import my.lllprint.server.catalogue.CatalogueOptionRepository;
import my.lllprint.server.catalogue.ChargedPer;
import my.lllprint.server.catalogue.CustomerPrice;
import my.lllprint.server.catalogue.CustomerPriceRepository;
import my.lllprint.server.contacts.Contact;
import my.lllprint.server.contacts.ContactRepository;
import my.lllprint.server.identity.AskingAccount;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Starting an order, saving it, and reading it back with its working out
 * (FR-1, FR-2).
 *
 * <p>One place owns each write. The form's save is this one method, and it owns
 * its transaction: the order, its three levels and its totals are written
 * together or not at all.
 *
 * <p>Nothing the browser sends about a price is believed. Every price is
 * resolved here from the catalogue, the customer's own prices, or a one-off
 * price typed for this order, in that order (FR-1.5, SEC-7).
 */
@Service
public class OrderService {

	private static final String QUOTATION = "quotation";

	private final QuotationRepository quotations;

	private final QuotationSpecificationRepository specifications;

	private final QuotationGarmentGroupRepository garmentGroups;

	private final QuotationSizeRepository sizes;

	private final QuotationChargeRepository charges;

	private final DocumentNumberRepository numbers;

	private final CatalogueOptionRepository options;

	private final CustomerPriceRepository customerPrices;

	private final ContactRepository contacts;

	public OrderService(QuotationRepository quotations, QuotationSpecificationRepository specifications,
			QuotationGarmentGroupRepository garmentGroups, QuotationSizeRepository sizes,
			QuotationChargeRepository charges, DocumentNumberRepository numbers,
			CatalogueOptionRepository options, CustomerPriceRepository customerPrices,
			ContactRepository contacts) {
		this.quotations = quotations;
		this.specifications = specifications;
		this.garmentGroups = garmentGroups;
		this.sizes = sizes;
		this.charges = charges;
		this.numbers = numbers;
		this.options = options;
		this.customerPrices = customerPrices;
		this.contacts = contacts;
	}

	/**
	 * Starts a draft. The job title is the first thing typed, and the order is
	 * known by it from then on (FR-1.2).
	 */
	@Transactional
	public Quotation startDraft(AskingAccount account, String jobTitle) {
		String title = tidy(jobTitle);
		if (title == null) {
			throw new Refused(Refusal.INVALID, "The order needs a job title.",
					Map.of("jobTitle", "Type what this order is called."));
		}
		return quotations.saveAndFlush(new Quotation(account.shopId(), nextNumber(account), title));
	}

	/**
	 * Saves what has been typed so far, and works the total out again from the
	 * lines (SEC-7).
	 *
	 * <p>Accepted only while the order is a draft. Once sent, the priced columns
	 * are frozen and a change is a new quotation rather than an edit (FR-2.7,
	 * SEC-9a).
	 */
	@Transactional
	public SavedOrder save(AskingAccount account, Long id, TypedOrder typed) {
		Quotation quotation = mine(account, id);

		if (!quotation.isDraft()) {
			throw new Refused(Refusal.NOT_POSSIBLE_NOW,
					"This order has already been sent, so it cannot be changed. Make a new quotation instead.");
		}
		if (quotation.version() == null || quotation.version() != typed.version()) {
			throw new Refused(Refusal.CHANGED_BY_SOMEONE_ELSE,
					"Someone else changed this order since it was read. Look at it again before saving.");
		}

		Contact customer = customerOrNothing(account, typed.contactId());
		Map<Long, Long> theirOwnPrices = pricesFor(account, customer);

		// Build what the calculator needs, resolving every price here.
		List<OrderToPrice.Specification> specificationsToPrice = new ArrayList<>();
		for (TypedOrder.TypedSpecification typedSpecification : typed.specifications()) {
			OrderToPrice.SpecificationKind kind = specificationKind(typedSpecification.kind());
			OrderToPrice.Chosen chosen = resolve(account, typedSpecification.catalogueOptionId(),
					typedSpecification.onePriceSen(), theirOwnPrices);
			specificationsToPrice.add(new OrderToPrice.Specification(kind, chosen));
		}

		List<OrderToPrice.GarmentGroup> groupsToPrice = new ArrayList<>();
		for (TypedOrder.TypedGarmentGroup typedGroup : typed.garmentGroups()) {
			List<OrderToPrice.SizeEntry> sizeEntries = new ArrayList<>();
			for (TypedOrder.TypedSize typedSize : typedGroup.sizes()) {
				OrderToPrice.Chosen size = resolve(account, typedSize.catalogueOptionId(), typedSize.onePriceSen(),
						theirOwnPrices);
				if (size == null) {
					throw new Refused(Refusal.INVALID, "Every size entry needs a size chosen.",
							Map.of("catalogueOptionId", "Choose a size."));
				}
				sizeEntries.add(new OrderToPrice.SizeEntry(size, typedSize.quantity(), tidy(typedSize.note())));
			}
			groupsToPrice.add(new OrderToPrice.GarmentGroup(
					resolve(account, typedGroup.neckOptionId(), typedGroup.neckOnePriceSen(), theirOwnPrices),
					resolve(account, typedGroup.sleeveOptionId(), typedGroup.sleeveOnePriceSen(), theirOwnPrices),
					tidy(typedGroup.note()), sizeEntries));
		}

		List<OrderToPrice.OrderCharge> chargesToPrice = new ArrayList<>();
		for (TypedOrder.TypedCharge typedCharge : typed.charges()) {
			chargesToPrice.add(new OrderToPrice.OrderCharge(tidy(typedCharge.name()), typedCharge.amountSen(),
					chargedPer(typedCharge.chargedPer())));
		}

		OrderToPrice toPrice = new OrderToPrice(typed.onePriceOverrideSen(), specificationsToPrice, groupsToPrice,
				chargesToPrice, typed.shippingChargeSen());
		PriceWorkings workings = OrderPricing.workOut(toPrice);

		quotation.typedOnTheForm(tidy(typed.jobTitle()), customer == null ? null : customer.id(),
				customer == null ? null : customer.name(),
				customer == null ? null : customer.phone(),
				customer == null ? null : customer.email(),
				customer == null ? null : customer.address(),
				typed.dateWanted(), tidy(typed.sourceNote()), typed.shippingChargeSen());
		quotation.totals(workings.lines().get(0).eachSen(), workings.itemSubtotalSen(), workings.grandTotalSen());

		writeTheLevels(account, quotation, specificationsToPrice, groupsToPrice, chargesToPrice, typed);

		return read(account, quotation.id());
	}

	/** One order, all three levels, and the total worked out again from them (SEC-7). */
	@Transactional(readOnly = true)
	public SavedOrder read(AskingAccount account, Long id) {
		Quotation quotation = mine(account, id);

		List<QuotationSpecification> savedSpecifications =
				specifications.findByQuotationIdOrderBySortOrderAscIdAsc(quotation.id());
		List<QuotationGarmentGroup> savedGroups =
				garmentGroups.findByQuotationIdOrderBySortOrderAscIdAsc(quotation.id());
		List<QuotationCharge> savedCharges = charges.findByQuotationIdOrderBySortOrderAscIdAsc(quotation.id());

		Map<Long, List<QuotationSize>> sizesByGroup = new HashMap<>();
		for (QuotationGarmentGroup group : savedGroups) {
			sizesByGroup.put(group.id(), sizes.findByGarmentGroupIdOrderBySortOrderAscIdAsc(group.id()));
		}

		List<OrderToPrice.Specification> toPriceSpecifications = savedSpecifications.stream()
				.map(saved -> new OrderToPrice.Specification(saved.kind(), new OrderToPrice.Chosen(
						saved.catalogueOptionId(), saved.name(), saved.priceSen(), saved.chargedPer())))
				.toList();

		List<OrderToPrice.GarmentGroup> toPriceGroups = savedGroups.stream()
				.map(group -> new OrderToPrice.GarmentGroup(group.neck(), group.sleeve(), group.note(),
						sizesByGroup.getOrDefault(group.id(), List.of()).stream()
								.map(size -> new OrderToPrice.SizeEntry(size.chosen(), size.quantity(), size.note()))
								.toList()))
				.toList();

		List<OrderToPrice.OrderCharge> toPriceCharges = savedCharges.stream()
				.map(charge -> new OrderToPrice.OrderCharge(charge.name(), charge.amountSen(), charge.chargedPer()))
				.toList();

		PriceWorkings workings = OrderPricing.workOut(new OrderToPrice(
				// A one-off price is already stored in the base line, so reading
				// back needs no override.
				null, toPriceSpecifications, toPriceGroups, toPriceCharges, quotation.shippingChargeSen()));

		return new SavedOrder(quotation, savedSpecifications, savedGroups, sizesByGroup, savedCharges, workings);
	}

	@Transactional(readOnly = true)
	public List<Quotation> list(AskingAccount account) {
		return quotations.findByShopIdOrderByIdDesc(account.shopId());
	}

	/**
	 * Writes the three levels again from scratch.
	 *
	 * <p>A draft being typed changes shape constantly - a garment group removed,
	 * a size added - so the saved levels are replaced rather than matched up row
	 * by row. The whole save is one transaction, so nothing is ever half
	 * replaced.
	 */
	private void writeTheLevels(AskingAccount account, Quotation quotation,
			List<OrderToPrice.Specification> specificationsToPrice, List<OrderToPrice.GarmentGroup> groupsToPrice,
			List<OrderToPrice.OrderCharge> chargesToPrice, TypedOrder typed) {
		for (QuotationGarmentGroup existing : garmentGroups.findByQuotationIdOrderBySortOrderAscIdAsc(
				quotation.id())) {
			sizes.deleteByGarmentGroupId(existing.id());
		}
		sizes.flush();
		garmentGroups.deleteByQuotationId(quotation.id());
		specifications.deleteByQuotationId(quotation.id());
		charges.deleteByQuotationId(quotation.id());
		garmentGroups.flush();

		int order = 0;
		for (OrderToPrice.Specification specification : specificationsToPrice) {
			OrderToPrice.Chosen chosen = specification.chosen();
			if (chosen == null) {
				continue;
			}
			specifications.save(new QuotationSpecification(account.shopId(), quotation.id(), specification.kind(),
					chosen.catalogueOptionId(), chosen.name(), chosen.priceSen(), chosen.chargedPer(), order++));
		}

		order = 0;
		for (int groupIndex = 0; groupIndex < groupsToPrice.size(); groupIndex++) {
			OrderToPrice.GarmentGroup group = groupsToPrice.get(groupIndex);
			QuotationGarmentGroup saved =
					new QuotationGarmentGroup(account.shopId(), quotation.id(), group.note(), order++);
			saved.neck(group.neck());
			saved.sleeve(group.sleeve());
			garmentGroups.save(saved);
			garmentGroups.flush();

			int sizeOrder = 0;
			List<TypedOrder.TypedSize> typedSizes = typed.garmentGroups().get(groupIndex).sizes();
			for (int sizeIndex = 0; sizeIndex < group.sizes().size(); sizeIndex++) {
				OrderToPrice.SizeEntry entry = group.sizes().get(sizeIndex);
				sizes.save(new QuotationSize(account.shopId(), saved.id(), entry.size(), (int) entry.quantity(),
						tidy(typedSizes.get(sizeIndex).note()), sizeOrder++));
			}
		}

		order = 0;
		for (OrderToPrice.OrderCharge charge : chargesToPrice) {
			charges.save(new QuotationCharge(account.shopId(), quotation.id(), charge.name(), charge.amountSen(),
					charge.chargedPer(), order++));
		}
		charges.flush();
	}

	/**
	 * FR-1.5, in order: a one-off price typed for this order, then a price set
	 * for this customer, then the standard price from the catalogue.
	 *
	 * <p>The name and the way it is charged always come from the catalogue. What
	 * the browser sent about either is ignored (SEC-2).
	 */
	private OrderToPrice.Chosen resolve(AskingAccount account, Long optionId, Long onePriceSen,
			Map<Long, Long> theirOwnPrices) {
		if (optionId == null) {
			return null;
		}
		CatalogueOption option = options.findByIdAndShopId(optionId, account.shopId())
				.orElseThrow(() -> new Refused(Refusal.INVALID, "That option is not in this shop's catalogue.",
						Map.of("catalogueOptionId", "Choose one from the list.")));

		long priceSen;
		if (onePriceSen != null) {
			priceSen = onePriceSen;
		}
		else if (theirOwnPrices.containsKey(option.id())) {
			priceSen = theirOwnPrices.get(option.id());
		}
		else {
			priceSen = option.standardPriceSen();
		}
		return new OrderToPrice.Chosen(option.id(), option.name(), priceSen, option.chargedPer());
	}

	private Map<Long, Long> pricesFor(AskingAccount account, Contact customer) {
		if (customer == null) {
			return Map.of();
		}
		Map<Long, Long> prices = new HashMap<>();
		for (CustomerPrice price : customerPrices.findByShopIdAndContactId(account.shopId(), customer.id())) {
			prices.put(price.catalogueOptionId(), price.priceSen());
		}
		return prices;
	}

	private Contact customerOrNothing(AskingAccount account, Long contactId) {
		if (contactId == null) {
			return null;
		}
		return contacts.findByIdAndShopId(contactId, account.shopId())
				.orElseThrow(() -> new Refused(Refusal.INVALID, "That customer is not in this shop.",
						Map.of("contactId", "Choose a customer.")));
	}

	private Quotation mine(AskingAccount account, Long id) {
		return quotations.findByIdAndShopId(id, account.shopId())
				// Another shop's order is answered exactly like one that does not
				// exist, so nothing is revealed (SEC-2).
				.orElseThrow(() -> new Refused(Refusal.NOT_FOUND, "That order is not in this shop."));
	}

	/** Q-0001, taken inside this transaction so two orders cannot take the same one (D-X). */
	private String nextNumber(AskingAccount account) {
		DocumentNumber counter = numbers.findByShopIdAndKind(account.shopId(), QUOTATION)
				.orElseGet(() -> numbers.saveAndFlush(new DocumentNumber(account.shopId(), QUOTATION)));
		long next = counter.takeTheNext();
		numbers.saveAndFlush(counter);
		return "Q-%04d".formatted(next);
	}

	private static OrderToPrice.SpecificationKind specificationKind(String kind) {
		try {
			return OrderToPrice.SpecificationKind.valueOf(kind.strip().toUpperCase());
		}
		catch (IllegalArgumentException | NullPointerException notOneOfThem) {
			throw new Refused(Refusal.INVALID, "That is not one of the order specifications.",
					Map.of("kind", "Use material, printing_method or print_location."));
		}
	}

	private static ChargedPer chargedPer(String chargedPer) {
		return ChargedPer.find(chargedPer == null ? "" : chargedPer.strip())
				.orElseThrow(() -> new Refused(Refusal.INVALID, "Say how this charge is made.",
						Map.of("chargedPer", "Use piece or order.")));
	}

	private static String tidy(String value) {
		if (value == null) {
			return null;
		}
		String tidied = value.strip();
		return tidied.isEmpty() ? null : tidied;
	}

	/** An order as it was saved, with its levels and the working out. */
	public record SavedOrder(
			Quotation quotation,
			List<QuotationSpecification> specifications,
			List<QuotationGarmentGroup> garmentGroups,
			Map<Long, List<QuotationSize>> sizesByGroup,
			List<QuotationCharge> charges,
			PriceWorkings workings) {
	}

}
