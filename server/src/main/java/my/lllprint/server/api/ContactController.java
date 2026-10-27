package my.lllprint.server.api;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import my.lllprint.server.contacts.Contact;
import my.lllprint.server.contacts.ContactService;

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
 * The customers (FR-9, SDD section 6).
 *
 * <p>Admin's alone. Module 1 adds a customer while an order is being typed;
 * module 4 builds the full screen.
 *
 * <p>There is no address that deletes one. A customer a quotation points at is
 * never deleted, and MySQL refuses it anyway (SEC-9).
 */
@RestController
@RequestMapping("/api/v1/contacts")
public class ContactController {

	private final ContactService contacts;

	private final CurrentAccount current;

	public ContactController(ContactService contacts, CurrentAccount current) {
		this.contacts = contacts;
		this.current = current;
	}

	/** The list, or the ones whose name contains what was searched for (FR-14). */
	@GetMapping
	public List<ContactReply> list(@RequestParam(required = false) String search) {
		return contacts.list(current.requireAdmin(), search).stream().map(ContactReply::of).toList();
	}

	@GetMapping("/{id}")
	public ContactReply one(@PathVariable Long id) {
		return ContactReply.of(contacts.one(current.requireAdmin(), id));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ContactReply add(@Valid @RequestBody CustomerDetails request) {
		return ContactReply.of(contacts.add(current.requireAdmin(), request.name(), request.phone(),
				request.email(), request.address(), request.internalNote()));
	}

	@PutMapping("/{id}")
	public ContactReply change(@PathVariable Long id, @Valid @RequestBody ChangeCustomer request) {
		return ContactReply.of(contacts.change(current.requireAdmin(), id, request.version(), request.name(),
				request.phone(), request.email(), request.address(), request.internalNote()));
	}

	public record CustomerDetails(
			@NotBlank(message = "Type the customer's name.") @Size(max = 200) String name,
			@Size(max = 40) String phone,
			@Size(max = 254) String email,
			@Size(max = 500) String address,
			@Size(max = 2000) String internalNote) {
	}

	public record ChangeCustomer(
			@NotBlank(message = "Type the customer's name.") @Size(max = 200) String name,
			@Size(max = 40) String phone,
			@Size(max = 254) String email,
			@Size(max = 500) String address,
			@Size(max = 2000) String internalNote,
			long version) {
	}

	/**
	 * What a screen is told about a customer.
	 *
	 * <p>The note for the shop is here, because this address is Admin's. The
	 * address behind the customer's own link does not select it (FR-9.5).
	 */
	public record ContactReply(Long id, String name, String phone, String email, String address,
			String internalNote, Long version) {

		static ContactReply of(Contact contact) {
			return new ContactReply(contact.id(), contact.name(), contact.phone(), contact.email(),
					contact.address(), contact.internalNote(), contact.version());
		}

	}

}
