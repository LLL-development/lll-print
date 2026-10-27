package my.lllprint.server.order;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * What the order form sends when it saves.
 *
 * <p>It sends no total, no shop, and no price it worked out itself. It sends
 * which options were chosen and how many of each, and the server does the rest
 * (SEC-2, SEC-7).
 *
 * <p>A one-off price may be typed over any option for this order only, which is
 * step one of FR-1.5.
 */
public record TypedOrder(
		@NotBlank(message = "Type the job title.") @Size(max = 200) String jobTitle,
		Long contactId,
		LocalDate dateWanted,
		@Size(max = 500) String sourceNote,
		@PositiveOrZero(message = "Delivery cannot be below zero.") long shippingChargeSen,
		Long onePriceOverrideSen,
		List<TypedSpecification> specifications,
		List<TypedGarmentGroup> garmentGroups,
		List<TypedCharge> charges,
		long version) {

	public TypedOrder {
		specifications = specifications == null ? List.of() : List.copyOf(specifications);
		garmentGroups = garmentGroups == null ? List.of() : List.copyOf(garmentGroups);
		charges = charges == null ? List.of() : List.copyOf(charges);
	}

	/** Level one. The cloth is one of these, and it carries the base price (FR-1.4a). */
	public record TypedSpecification(
			@NotBlank(message = "Say which specification this is.") String kind,
			Long catalogueOptionId,
			Long onePriceSen) {
	}

	/** Level two. Its neck, its sleeve, a note with no price effect, and its sizes. */
	public record TypedGarmentGroup(
			Long neckOptionId,
			Long neckOnePriceSen,
			Long sleeveOptionId,
			Long sleeveOnePriceSen,
			@Size(max = 500) String note,
			List<TypedSize> sizes) {

		public TypedGarmentGroup {
			sizes = sizes == null ? List.of() : List.copyOf(sizes);
		}

	}

	/** Level three. One size, how many, and a note that identifies one piece. */
	public record TypedSize(
			Long catalogueOptionId,
			Long onePriceSen,
			int quantity,
			@Size(max = 200) String note) {
	}

	/** A charge typed on the whole order, such as artwork setup (FR-1.6a). */
	public record TypedCharge(
			@NotBlank(message = "Type what the charge is for.") @Size(max = 200) String name,
			long amountSen,
			@NotBlank(message = "Say how this charge is made.") String chargedPer) {
	}

}
