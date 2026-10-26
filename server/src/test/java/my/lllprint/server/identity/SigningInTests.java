package my.lllprint.server.identity;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import my.lllprint.server.ApiTest;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Signing in, signing out, and the grants being read on every request.
 *
 * <p>Each test is one of the things SEC-1, SEC-2, SEC-3 and SEC-6 say must be
 * checked, sent straight to the server rather than through a screen.
 */
class SigningInTests extends ApiTest {

	@Autowired
	private MovableClock clock;

	/**
	 * A clock the test can move on, so that a session running out is tested by
	 * time passing rather than by editing the row behind the server's back.
	 */
	@TestConfiguration
	static class ClockThatCanBeMoved {

		// A different bean name from the real one in SecurityConfig, so this is a
		// second clock the test prefers rather than an override of the first.
		@Bean
		@Primary
		MovableClock clockForThisTest() {
			return new MovableClock(Instant.parse("2026-10-22T01:00:00Z"));
		}

	}

	static final class MovableClock extends Clock {

		private Instant now;

		MovableClock(Instant now) {
			this.now = now;
		}

		void moveOn(Duration by) {
			this.now = this.now.plus(by);
		}

		@Override
		public Instant instant() {
			return now;
		}

		@Override
		public ZoneId getZone() {
			return ZoneOffset.UTC;
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return this;
		}

	}

	@Test
	void an_admin_signs_in_and_is_told_who_it_is() throws Exception {
		account("admin-one", StaffRole.ADMIN);

		String token = signIn("admin-one");

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.username").value("admin-one"))
				.andExpect(jsonPath("$.role").value("admin"))
				.andExpect(jsonPath("$.admin").value(true));
	}

	@Test
	void a_new_staff_account_may_do_nothing_until_admin_grants_something() throws Exception {
		account("staff-one", StaffRole.STAFF);

		String token = signIn("staff-one");

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.admin").value(false))
				.andExpect(jsonPath("$.grants").isEmpty());
	}

	@Test
	void a_granted_action_shows_and_an_unticked_one_disappears_on_the_next_request() throws Exception {
		StaffAccount staff = account("staff-two", StaffRole.STAFF);
		StaffGrant grant = grants.save(new StaffGrant(shopId, staff.id(), GrantAction.RECORD_PAYMENT));

		String token = signIn("staff-two");

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.grants[0]").value("record_payment"));

		// Admin unticks it. The same token must now show nothing, because the
		// grants are read from the account rows on every request (D-AF, FR-10.1).
		grants.delete(grant);
		grants.flush();

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.grants").isEmpty());
	}

	@Test
	void the_wrong_password_is_refused() throws Exception {
		account("admin-two", StaffRole.ADMIN);

		server.perform(post("/api/v1/sessions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"admin-two\",\"password\":\"not-the-password\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void a_username_that_does_not_exist_is_refused_in_the_same_words() throws Exception {
		account("admin-three", StaffRole.ADMIN);

		String wrongPassword = server.perform(post("/api/v1/sessions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"admin-three\",\"password\":\"not-the-password\"}"))
				.andReturn().getResponse().getContentAsString();

		String noSuchAccount = server.perform(post("/api/v1/sessions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"nobody-at-all\",\"password\":\"not-the-password\"}"))
				.andExpect(status().isUnauthorized())
				.andReturn().getResponse().getContentAsString();

		// Neither reply tells the caller which of the two was wrong (SEC-2).
		assertThat(noSuchAccount).isEqualTo(wrongPassword);
	}

	@Test
	void a_switched_off_account_cannot_sign_in() throws Exception {
		StaffAccount staff = account("staff-three", StaffRole.STAFF);
		staff.switchOff();
		accounts.flush();

		server.perform(post("/api/v1/sessions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"staff-three\",\"password\":\"" + PASSWORD + "\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void switching_an_account_off_refuses_the_token_it_already_holds() throws Exception {
		StaffAccount staff = account("staff-four", StaffRole.STAFF);
		String token = signIn("staff-four");

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk());

		staff.switchOff();
		accounts.flush();

		// The next tap, on every device at once (FR-10.1, SEC-6).
		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void signing_out_refuses_the_token_afterwards() throws Exception {
		account("admin-four", StaffRole.ADMIN);
		String token = signIn("admin-four");

		server.perform(delete("/api/v1/sessions/current").header("Authorization", "Bearer " + token))
				.andExpect(status().isNoContent());

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void a_session_that_has_run_out_is_refused() throws Exception {
		account("admin-five", StaffRole.ADMIN);
		String token = signIn("admin-five");

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk());

		// A day later, with nothing else changed, the same token is no longer
		// good (SEC-6). The session is twelve hours long.
		clock.moveOn(Duration.ofHours(13));

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void a_request_with_no_token_is_refused() throws Exception {
		server.perform(get("/api/v1/me"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void a_made_up_token_is_refused() throws Exception {
		server.perform(get("/api/v1/me").header("Authorization", "Bearer made.up"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void a_real_token_with_the_signature_changed_is_refused() throws Exception {
		account("admin-six", StaffRole.ADMIN);
		String token = signIn("admin-six");
		String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

		server.perform(get("/api/v1/me").header("Authorization", "Bearer " + tampered))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void no_reply_ever_carries_the_stored_password() throws Exception {
		account("admin-seven", StaffRole.ADMIN);

		String signedIn = server.perform(post("/api/v1/sessions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"admin-seven\",\"password\":\"" + PASSWORD + "\"}"))
				.andReturn().getResponse().getContentAsString();

		assertThat(signedIn).doesNotContain("password").doesNotContain("$2a$");
	}

	@Test
	void a_sign_in_with_nothing_typed_names_the_fields() throws Exception {
		server.perform(post("/api/v1/sessions")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\":\"\",\"password\":\"\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.refusal").value("invalid"))
				.andExpect(jsonPath("$.fields.username").exists())
				.andExpect(jsonPath("$.fields.password").exists());
	}

}
