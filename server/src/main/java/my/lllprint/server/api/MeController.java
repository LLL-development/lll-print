package my.lllprint.server.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Who is signed in, and every grant that account holds (FR-10.6, SDD section
 * 6).
 *
 * <p>Read from the account's own rows on this request, so an unticked grant shows
 * on the next screen that asks and a switched-off account is refused outright
 * (FR-10.1, D-AF).
 */
@RestController
@RequestMapping("/api/v1")
public class MeController {

	private final CurrentAccount current;

	public MeController(CurrentAccount current) {
		this.current = current;
	}

	@GetMapping("/me")
	public MeReply me() {
		return MeReply.of(current.get());
	}

}
