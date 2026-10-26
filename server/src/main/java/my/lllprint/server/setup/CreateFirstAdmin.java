package my.lllprint.server.setup;

import java.util.List;
import java.util.Optional;

import my.lllprint.server.identity.StaffAccount;
import my.lllprint.server.identity.StaffAccountRepository;
import my.lllprint.server.identity.StaffRole;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * The one setup step that cannot be done from inside the system.
 *
 * <p>Only an Admin may create a staff account, so the first Admin is created
 * once by the developer with this command. There is no sign-up screen and none
 * is in scope (SDD section 5, FR-10.1).
 *
 * <p>Run it like this, from {@code server/}:
 *
 * <pre>
 * ./mvnw spring-boot:run -Dspring-boot.run.arguments="create-first-admin --shop=LLL Print --name=Muflih --username=admin --password=..."
 * </pre>
 *
 * <p>It refuses to run twice. Once any account exists, accounts are made by
 * Admin through the Staff accounts screen in module 2.
 */
@Component
public class CreateFirstAdmin implements ApplicationRunner {

	private static final String COMMAND = "create-first-admin";

	private final StaffAccountRepository accounts;

	private final PasswordEncoder passwords;

	private final JdbcClient database;

	public CreateFirstAdmin(StaffAccountRepository accounts, PasswordEncoder passwords, JdbcClient database) {
		this.accounts = accounts;
		this.passwords = passwords;
		this.database = database;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments arguments) {
		if (!arguments.getNonOptionArgs().contains(COMMAND)) {
			return;
		}
		String shopName = required(arguments, "shop");
		String name = required(arguments, "name");
		String username = required(arguments, "username");
		String password = required(arguments, "password");

		if (password.length() < 12) {
			throw new IllegalArgumentException("the first password must be at least 12 characters");
		}
		if (accounts.count() > 0) {
			throw new IllegalStateException(
					"this shop already has accounts, so the first Admin exists. Make any further account as Admin, "
							+ "through the Staff accounts screen.");
		}

		Long shopId = onlyShop().orElseGet(() -> {
			database.sql("INSERT INTO shop (name) VALUES (?)").param(shopName).update();
			return database.sql("SELECT id FROM shop ORDER BY id DESC LIMIT 1").query(Long.class).single();
		});

		StaffAccount admin = accounts.save(new StaffAccount(shopId, name, username, null,
				passwords.encode(password), StaffRole.ADMIN));

		// An Admin account holds every granted action by its role, so it gets no
		// rows in staff_grant. A new Staff account starts with none at all
		// (FR-10.1).
		System.out.printf("Created shop %d and Admin account %d (%s).%n", shopId, admin.id(), username);
	}

	private Optional<Long> onlyShop() {
		List<Long> ids = database.sql("SELECT id FROM shop ORDER BY id").query(Long.class).list();
		return ids.size() == 1 ? Optional.of(ids.get(0)) : Optional.empty();
	}

	private static String required(ApplicationArguments arguments, String name) {
		List<String> values = arguments.getOptionValues(name);
		if (values == null || values.isEmpty() || values.get(0).isBlank()) {
			throw new IllegalArgumentException("--" + name + " is needed");
		}
		return values.get(0).strip();
	}

}
