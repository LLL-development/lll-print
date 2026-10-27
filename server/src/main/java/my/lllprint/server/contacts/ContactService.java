package my.lllprint.server.contacts;

import java.util.List;
import java.util.Map;

import my.lllprint.server.api.Refusal;
import my.lllprint.server.api.Refused;
import my.lllprint.server.identity.AskingAccount;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The rules for customers (FR-9).
 *
 * <p>There is no address that deletes one, and MySQL refuses it anyway where a
 * quotation points at it (SEC-9).
 */
@Service
public class ContactService {

	private final ContactRepository contacts;

	public ContactService(ContactRepository contacts) {
		this.contacts = contacts;
	}

	@Transactional(readOnly = true)
	public List<Contact> list(AskingAccount account, String search) {
		if (search == null || search.isBlank()) {
			return contacts.findByShopIdOrderByNameAsc(account.shopId());
		}
		// Part of the name, in any case, finds the customer (FR-14).
		return contacts.findByShopIdAndNameContainingIgnoreCaseOrderByNameAsc(account.shopId(), search.strip());
	}

	@Transactional(readOnly = true)
	public Contact one(AskingAccount account, Long id) {
		return contacts.findByIdAndShopId(id, account.shopId())
				.orElseThrow(() -> new Refused(Refusal.NOT_FOUND, "That customer is not in this shop."));
	}

	@Transactional
	public Contact add(AskingAccount account, String name, String phone, String email, String address,
			String internalNote) {
		String tidyName = requiredName(name);
		reachable(phone, email);
		return contacts.saveAndFlush(new Contact(account.shopId(), tidyName, tidy(phone), tidy(email),
				tidy(address), tidy(internalNote)));
	}

	@Transactional
	public Contact change(AskingAccount account, Long id, long version, String name, String phone, String email,
			String address, String internalNote) {
		Contact contact = one(account, id);
		if (contact.version() == null || contact.version() != version) {
			throw new Refused(Refusal.CHANGED_BY_SOMEONE_ELSE,
					"Someone else changed this customer since it was read. Look at it again before saving.");
		}
		String tidyName = requiredName(name);
		reachable(phone, email);
		contact.change(tidyName, tidy(phone), tidy(email), tidy(address), tidy(internalNote));
		return contacts.saveAndFlush(contact);
	}

	/** FR-9.2. At least one way of reaching them, and MySQL checks it too. */
	private static void reachable(String phone, String email) {
		if (tidy(phone) == null && tidy(email) == null) {
			throw new Refused(Refusal.INVALID, "A customer needs a phone number or an email address.",
					Map.of("phone", "Type one of the two.", "email", "Type one of the two."));
		}
	}

	private static String requiredName(String name) {
		String tidied = tidy(name);
		if (tidied == null) {
			throw new Refused(Refusal.INVALID, "The customer needs a name.", Map.of("name", "Type a name."));
		}
		return tidied;
	}

	private static String tidy(String value) {
		if (value == null) {
			return null;
		}
		String tidied = value.strip();
		return tidied.isEmpty() ? null : tidied;
	}

}
