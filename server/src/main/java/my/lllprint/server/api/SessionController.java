package my.lllprint.server.api;

import java.time.Instant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import my.lllprint.server.identity.SignInService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Signing in and signing out (SDD section 6).
 *
 * <p>Built in module 1, because nothing else can be saved until it exists.
 */
@RestController
@RequestMapping("/api/v1")
public class SessionController {

	private final SignInService signIn;

	private final CurrentAccount current;

	public SessionController(SignInService signIn, CurrentAccount current) {
		this.signIn = signIn;
		this.current = current;
	}

	/** Sign in. Replies with the signed token. */
	@PostMapping("/sessions")
	public SignedInReply signIn(@Valid @RequestBody SignInRequest request) {
		SignInService.SignedIn signedIn = signIn.signIn(request.username(), request.password());
		return new SignedInReply(signedIn.token(), signedIn.expiresAt(), MeReply.of(signedIn.account()));
	}

	/**
	 * Sign out. The session ends, so the token is refused from now on, on every
	 * device at once (SEC-6).
	 */
	@DeleteMapping("/sessions/current")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void signOut() {
		signIn.signOut(current.get().sessionId());
	}

	/** What a screen sends to sign in. It never sends a role, a shop or a grant (SEC-2). */
	public record SignInRequest(
			@NotBlank(message = "Type the username.") @Size(max = 100) String username,
			@NotBlank(message = "Type the password.") @Size(max = 200) String password) {
	}

	/** The token, when it runs out, and who it belongs to. The password is never in a reply (SEC-6). */
	public record SignedInReply(String token, Instant expiresAt, MeReply account) {
	}

}
