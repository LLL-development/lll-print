package my.lllprint.server.catalogue;

import java.util.List;
import java.util.Map;

import my.lllprint.server.api.Refusal;
import my.lllprint.server.api.Refused;
import my.lllprint.server.identity.AskingAccount;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The rules for the option catalogue (FR-12).
 *
 * <p>Who is allowed to call these is decided in the request layer, not here.
 * What is here is what the shop means: an option is never deleted, a price may
 * be below zero, the seven lists are kept apart, and the shop always comes from
 * the signed-in account.
 */
@Service
public class CatalogueService {

	private static final int LONGEST_NAME = 200;

	private final CatalogueOptionRepository options;

	public CatalogueService(CatalogueOptionRepository options) {
		this.options = options;
	}

	/**
	 * The option buttons, by kind.
	 *
	 * <p>An option no longer offered is left out unless it is asked for, because
	 * it must not appear on a new order (FR-12.5). The maintaining screen asks
	 * for it, so that Admin can see and bring back what was switched off.
	 */
	@Transactional(readOnly = true)
	public List<CatalogueOption> list(AskingAccount account, OptionKind kind, boolean includeNotOffered) {
		Long shopId = account.shopId();
		if (kind == null) {
			return includeNotOffered
					? options.findByShopIdOrderByKindAscSortOrderAscNameAsc(shopId)
					: options.findByShopIdAndOfferedOrderByKindAscSortOrderAscNameAsc(shopId, true);
		}
		return includeNotOffered
				? options.findByShopIdAndKindOrderBySortOrderAscNameAsc(shopId, kind)
				: options.findByShopIdAndKindAndOfferedOrderBySortOrderAscNameAsc(shopId, kind, true);
	}

	/**
	 * Adds an option, which is available on every order typed afterwards
	 * (FR-12.3). Adding one never needs a developer and never needs the system
	 * rebuilt.
	 */
	@Transactional
	public CatalogueOption add(AskingAccount account, OptionKind kind, String name, long standardPriceSen,
			ChargedPer chargedPer, int sortOrder) {
		String tidyName = tidy(name);
		refuseADuplicate(account, kind, tidyName);
		try {
			return options.saveAndFlush(
					new CatalogueOption(account.shopId(), kind, tidyName, standardPriceSen, chargedPer, sortOrder));
		}
		catch (DataIntegrityViolationException alreadyThere) {
			// Two people adding the same button at the same moment. The database
			// settles it by the unique rule, so no second row can exist (SEC-9).
			throw duplicate(tidyName);
		}
	}

	/**
	 * Changes an option's name, its standard price, how it is charged, whether it
	 * is still offered, and where it sits in the list (FR-12.4, FR-12.5).
	 *
	 * <p>The version read from the screen is sent back, so two people editing the
	 * same option cannot silently lose one of the edits (SEC-8).
	 */
	@Transactional
	public CatalogueOption change(AskingAccount account, Long id, long version, String name, long standardPriceSen,
			ChargedPer chargedPer, boolean offered, int sortOrder) {
		CatalogueOption option = options.findByIdAndShopId(id, account.shopId())
				// A record of another shop is answered exactly like one that does
				// not exist, so nothing is revealed (SEC-2).
				.orElseThrow(() -> new Refused(Refusal.NOT_FOUND, "That option is not in this shop's catalogue."));

		if (option.version() == null || option.version() != version) {
			throw new Refused(Refusal.CHANGED_BY_SOMEONE_ELSE,
					"Someone else changed this option since it was read. Look at it again before saving.");
		}

		String tidyName = tidy(name);
		if (!tidyName.equalsIgnoreCase(option.name())) {
			refuseADuplicate(account, option.kind(), tidyName);
		}

		option.change(tidyName, standardPriceSen, chargedPer, offered, sortOrder);
		try {
			return options.saveAndFlush(option);
		}
		catch (DataIntegrityViolationException alreadyThere) {
			throw duplicate(tidyName);
		}
	}

	private void refuseADuplicate(AskingAccount account, OptionKind kind, String name) {
		// The same name in a different kind is fine. The seven lists are kept
		// apart and a neck called Round is nothing to do with a size called Round
		// (FR-12.1).
		if (options.existsByShopIdAndKindAndName(account.shopId(), kind, name)) {
			throw duplicate(name);
		}
	}

	private static Refused duplicate(String name) {
		return new Refused(Refusal.INVALID, "This list already has a button called " + name + ".",
				Map.of("name", "Already in this list."));
	}

	private static String tidy(String name) {
		String tidied = name == null ? "" : name.strip();
		if (tidied.isEmpty()) {
			throw new Refused(Refusal.INVALID, "The button needs a name.", Map.of("name", "Type a name."));
		}
		if (tidied.length() > LONGEST_NAME) {
			throw new Refused(Refusal.INVALID, "That name is too long.",
					Map.of("name", "Keep it to " + LONGEST_NAME + " characters."));
		}
		return tidied;
	}

}
