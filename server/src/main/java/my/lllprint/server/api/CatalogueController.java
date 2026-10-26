package my.lllprint.server.api;

import java.util.List;
import java.util.Map;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import my.lllprint.server.catalogue.CatalogueOption;
import my.lllprint.server.catalogue.CatalogueService;
import my.lllprint.server.catalogue.ChargedPer;
import my.lllprint.server.catalogue.OptionKind;
import my.lllprint.server.identity.AskingAccount;
import my.lllprint.server.identity.GrantAction;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * The option catalogue and its standard prices (SDD section 6, FR-12).
 *
 * <p>Reading is open to any signed-in account of the shop, because every screen
 * needs the buttons. Changing it is Admin's, or a Staff account that Admin has
 * granted {@code maintain_catalogue} (FR-12.9, SEC-3).
 *
 * <p>There is deliberately no address that deletes an option. An option stops
 * being offered by a flag, and everything that already used it stays readable
 * (FR-12.5).
 */
@RestController
@RequestMapping("/api/v1/catalogue-options")
public class CatalogueController {

	private final CatalogueService catalogue;

	private final CurrentAccount current;

	public CatalogueController(CatalogueService catalogue, CurrentAccount current) {
		this.catalogue = catalogue;
		this.current = current;
	}

	/**
	 * The option buttons, by kind.
	 *
	 * <p>Without {@code kind} every list comes back at once, which is what an
	 * order form needs. Without {@code includeNotOffered} the ones no longer
	 * offered are left out, which is what a new order needs (FR-12.5).
	 */
	@GetMapping
	public List<CatalogueOptionReply> list(
			@RequestParam(required = false) String kind,
			@RequestParam(defaultValue = "false") boolean includeNotOffered) {
		AskingAccount account = current.get();
		List<CatalogueOption> found = catalogue.list(account, kindOrNothing(kind), includeNotOffered);
		return found.stream().map(CatalogueOptionReply::of).toList();
	}

	/** Adds an option. Available on every order typed afterwards (FR-12.3). */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CatalogueOptionReply add(@Valid @RequestBody AddOption request) {
		AskingAccount account = current.require(GrantAction.MAINTAIN_CATALOGUE);
		return CatalogueOptionReply.of(catalogue.add(account,
				kindOrRefuse(request.kind()),
				request.name(),
				request.standardPriceSen(),
				chargedPerOrRefuse(request.chargedPer()),
				request.sortOrder()));
	}

	/** Changes an option's name, price, how it is charged, or whether it is offered (FR-12.4, FR-12.5). */
	@PutMapping("/{id}")
	public CatalogueOptionReply change(@PathVariable Long id, @Valid @RequestBody ChangeOption request) {
		AskingAccount account = current.require(GrantAction.MAINTAIN_CATALOGUE);
		return CatalogueOptionReply.of(catalogue.change(account,
				id,
				request.version(),
				request.name(),
				request.standardPriceSen(),
				chargedPerOrRefuse(request.chargedPer()),
				request.offered(),
				request.sortOrder()));
	}

	private static OptionKind kindOrNothing(String kind) {
		if (kind == null || kind.isBlank()) {
			return null;
		}
		return kindOrRefuse(kind);
	}

	private static OptionKind kindOrRefuse(String kind) {
		return OptionKind.find(kind == null ? "" : kind.strip())
				.orElseThrow(() -> new Refused(Refusal.INVALID, "That is not one of the seven lists.",
						Map.of("kind", "Use one of: neck, sleeve, size, material, printing_method, "
								+ "print_location, names_and_numbers.")));
	}

	private static ChargedPer chargedPerOrRefuse(String chargedPer) {
		return ChargedPer.find(chargedPer == null ? "" : chargedPer.strip())
				.orElseThrow(() -> new Refused(Refusal.INVALID, "Say how this option is charged.",
						Map.of("chargedPer", "Use piece or order.")));
	}

	/**
	 * What a screen sends to add an option.
	 *
	 * <p>There is no rule against a price below zero, because that is how a thing
	 * worth less is expressed: Kids at minus RM 2.00 is -200 (FR-1.9, FR-12.2).
	 */
	public record AddOption(
			@NotBlank(message = "Say which list this button belongs to.") String kind,
			@NotBlank(message = "Type a name.") @Size(max = 200) String name,
			long standardPriceSen,
			@NotBlank(message = "Say how this option is charged.") String chargedPer,
			@PositiveOrZero(message = "The position in the list cannot be below zero.") int sortOrder) {
	}

	/**
	 * What a screen sends to change one.
	 *
	 * <p>The kind is not here. An option never moves from one list to another,
	 * because that would change what an order already written meant (FR-12.1).
	 *
	 * <p>The version is the one the screen read. Sending back an old one is
	 * refused rather than overwriting somebody else's change (SEC-8).
	 */
	public record ChangeOption(
			@NotBlank(message = "Type a name.") @Size(max = 200) String name,
			long standardPriceSen,
			@NotBlank(message = "Say how this option is charged.") String chargedPer,
			boolean offered,
			@PositiveOrZero(message = "The position in the list cannot be below zero.") int sortOrder,
			long version) {
	}

}
