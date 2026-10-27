package my.lllprint.server;

import java.security.SecureRandom;
import java.util.Base64;

import my.lllprint.server.identity.GrantAction;
import my.lllprint.server.identity.StaffAccount;
import my.lllprint.server.identity.StaffAccountRepository;
import my.lllprint.server.identity.StaffGrant;
import my.lllprint.server.identity.StaffGrantRepository;
import my.lllprint.server.identity.StaffRole;

import org.junit.jupiter.api.BeforeEach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * What every test of the API needs: a shop, accounts that can sign in, and a
 * way to send a real request to the real server.
 *
 * <p>Everything written by a test is rolled back, so the database is left as
 * empty as it was found.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public abstract class ApiTest {

	protected static final String PASSWORD = "a-real-enough-password";

	@DynamicPropertySource
	static void aSecretJustForThisRun(DynamicPropertyRegistry registry) {
		// Made up on the spot, so no signing secret is ever committed (SEC-4).
		byte[] bytes = new byte[48];
		new SecureRandom().nextBytes(bytes);
		registry.add("lllprint.sign-in.token-secret",
				() -> Base64.getUrlEncoder().withoutPadding().encodeToString(bytes));
	}

	@Autowired
	protected MockMvc server;

	@Autowired
	protected JdbcClient database;

	@Autowired
	protected StaffAccountRepository accounts;

	@Autowired
	protected StaffGrantRepository grants;

	@Autowired
	protected PasswordEncoder passwords;

	protected Long shopId;

	@BeforeEach
	void oneShopToBelongTo() {
		database.sql("INSERT INTO shop (name) VALUES ('KEM PENGAKAP test shop')").update();
		shopId = database.sql("SELECT id FROM shop ORDER BY id DESC LIMIT 1").query(Long.class).single();
	}

	protected StaffAccount account(String username, StaffRole role) {
		return accounts.save(new StaffAccount(shopId, "Test " + username, username, null,
				passwords.encode(PASSWORD), role));
	}

	/** Admin ticks one of the eleven actions for this account (FR-10.2). */
	protected StaffGrant grant(StaffAccount account, GrantAction action) {
		return grants.saveAndFlush(new StaffGrant(shopId, account.id(), action));
	}

	/** Signs in over the real address and hands back the token, exactly as a screen would. */
	protected String signIn(String username) throws Exception {
		return signIn(username, PASSWORD);
	}

	protected String signIn(String username, String password) throws Exception {
		String reply = server.perform(post("/api/v1/sessions")
				.contentType(org.springframework.http.MediaType.APPLICATION_JSON)
				.content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		int at = reply.indexOf("\"token\":\"") + 9;
		return reply.substring(at, reply.indexOf('"', at));
	}

}
