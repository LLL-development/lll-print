package my.lllprint.server.catalogue;

import my.lllprint.server.ApiTest;
import my.lllprint.server.identity.GrantAction;
import my.lllprint.server.identity.StaffAccount;
import my.lllprint.server.identity.StaffRole;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The option catalogue and its standard prices (FR-12).
 *
 * <p>The shop's own buttons are used throughout rather than made-up ones:
 * EYELAT 170gsm as a material, Collar Zip as a neck, and Kids at minus RM 2.00,
 * which is the reason a price is allowed below zero.
 */
class CatalogueTests extends ApiTest {

	@Autowired
	private CatalogueOptionRepository options;

	private String adminToken() throws Exception {
		account("admin-cat", StaffRole.ADMIN);
		return signIn("admin-cat");
	}

	private static String optionJson(String kind, String name, long sen, String chargedPer, int sortOrder) {
		return """
				{"kind":"%s","name":"%s","standardPriceSen":%d,"chargedPer":"%s","sortOrder":%d}"""
				.formatted(kind, name, sen, chargedPer, sortOrder);
	}

	@Test
	void admin_adds_a_material_and_it_comes_back_in_the_list() throws Exception {
		String token = adminToken();

		server.perform(post("/api/v1/catalogue-options")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("material", "EYELAT 170gsm", 0, "piece", 1)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("EYELAT 170gsm"))
				.andExpect(jsonPath("$.kind").value("material"))
				.andExpect(jsonPath("$.offered").value(true))
				.andExpect(jsonPath("$.version").value(0));

		server.perform(get("/api/v1/catalogue-options").param("kind", "material")
				.header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("EYELAT 170gsm"));
	}

	@Test
	void a_price_below_zero_is_accepted_because_that_is_how_kids_is_priced() throws Exception {
		String token = adminToken();

		// Kids at minus RM 2.00 is -200 (FR-1.9, FR-12.2).
		server.perform(post("/api/v1/catalogue-options")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("size", "Kids", -200, "piece", 1)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.standardPriceSen").value(-200));
	}

	@Test
	void money_is_a_whole_number_of_sen_and_never_a_decimal() throws Exception {
		String token = adminToken();

		String reply = server.perform(post("/api/v1/catalogue-options")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("neck", "Collar Zip", 2800, "piece", 1)))
				.andReturn().getResponse().getContentAsString();

		assertThat(reply).contains("\"standardPriceSen\":2800").doesNotContain("28.0");
	}

	@Test
	void the_seven_lists_are_kept_apart_so_the_same_name_may_sit_in_two_of_them() throws Exception {
		String token = adminToken();

		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("neck", "Round", 0, "piece", 1)))
				.andExpect(status().isCreated());

		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("print_location", "Round", 0, "piece", 1)))
				.andExpect(status().isCreated());
	}

	@Test
	void the_same_name_twice_in_one_list_is_refused() throws Exception {
		String token = adminToken();

		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("neck", "Collar Zip", 0, "piece", 1)))
				.andExpect(status().isCreated());

		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("neck", "Collar Zip", 500, "piece", 2)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.refusal").value("invalid"))
				.andExpect(jsonPath("$.fields.name").exists());
	}

	@Test
	void a_made_up_kind_is_refused_and_says_which_lists_exist() throws Exception {
		String token = adminToken();

		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("colour", "Red", 0, "piece", 1)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.refusal").value("invalid"))
				.andExpect(jsonPath("$.fields.kind").exists());
	}

	@Test
	void stopping_an_option_being_offered_hides_it_from_a_new_order_but_keeps_the_record() throws Exception {
		String token = adminToken();
		CatalogueOption option = options.saveAndFlush(
				new CatalogueOption(shopId, OptionKind.MATERIAL, "Old cloth 150gsm", 100, ChargedPer.PIECE, 1));

		server.perform(put("/api/v1/catalogue-options/" + option.id())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Old cloth 150gsm","standardPriceSen":100,"chargedPer":"piece","offered":false,\
						"sortOrder":1,"version":0}"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.offered").value(false));

		// Gone from what a new order may choose (FR-12.5).
		server.perform(get("/api/v1/catalogue-options").param("kind", "material")
				.header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$").isEmpty());

		// Still there for the screen that maintains the catalogue, so it can be
		// brought back. The record itself is never deleted.
		server.perform(get("/api/v1/catalogue-options").param("kind", "material")
				.param("includeNotOffered", "true")
				.header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$[0].name").value("Old cloth 150gsm"));
		assertThat(options.findById(option.id())).isPresent();
	}

	@Test
	void changing_a_price_with_an_old_version_is_refused_rather_than_overwriting() throws Exception {
		String token = adminToken();
		CatalogueOption option = options.saveAndFlush(
				new CatalogueOption(shopId, OptionKind.NECK, "Collar Zip", 2800, ChargedPer.PIECE, 1));

		String change = """
				{"name":"Collar Zip","standardPriceSen":%d,"chargedPer":"piece","offered":true,\
				"sortOrder":1,"version":0}""";

		server.perform(put("/api/v1/catalogue-options/" + option.id())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(change.formatted(3000)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.standardPriceSen").value(3000))
				.andExpect(jsonPath("$.version").value(1));

		// Someone else still has the screen open on version 0 (SEC-8).
		server.perform(put("/api/v1/catalogue-options/" + option.id())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(change.formatted(9900)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.refusal").value("changed_by_someone_else"));

		assertThat(options.findById(option.id()).orElseThrow().standardPriceSen()).isEqualTo(3000);
	}

	@Test
	void a_staff_account_without_the_grant_cannot_add_an_option() throws Exception {
		account("staff-cat", StaffRole.STAFF);
		String token = signIn("staff-cat");

		// Refused by the server, not by a missing button (SEC-3, FR-12.9).
		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("neck", "Collar Zip", 0, "piece", 1)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.refusal").value("not_allowed"));

		assertThat(options.findByShopIdOrderByKindAscSortOrderAscNameAsc(shopId)).isEmpty();
	}

	@Test
	void a_staff_account_that_admin_granted_it_may_add_an_option() throws Exception {
		StaffAccount staff = account("staff-cat-two", StaffRole.STAFF);
		grant(staff, GrantAction.MAINTAIN_CATALOGUE);
		String token = signIn("staff-cat-two");

		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("material", "EYELAT 170gsm", 0, "piece", 1)))
				.andExpect(status().isCreated());
	}

	@Test
	void a_staff_account_may_read_the_buttons_without_any_grant() throws Exception {
		options.saveAndFlush(new CatalogueOption(shopId, OptionKind.NECK, "Collar Zip", 2800, ChargedPer.PIECE, 1));
		account("staff-cat-three", StaffRole.STAFF);
		String token = signIn("staff-cat-three");

		// Every screen needs the buttons, so reading them is open to any account
		// of the shop (SDD section 5).
		server.perform(get("/api/v1/catalogue-options").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Collar Zip"));
	}

	@Test
	void a_signed_out_request_reaches_nothing() throws Exception {
		server.perform(get("/api/v1/catalogue-options"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));

		server.perform(post("/api/v1/catalogue-options")
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("neck", "Collar Zip", 0, "piece", 1)))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void an_option_belonging_to_another_shop_is_answered_as_if_it_did_not_exist() throws Exception {
		String token = adminToken();
		database.sql("INSERT INTO shop (name) VALUES ('Another shop')").update();
		Long otherShop = database.sql("SELECT id FROM shop ORDER BY id DESC LIMIT 1").query(Long.class).single();
		CatalogueOption theirs = options.saveAndFlush(
				new CatalogueOption(otherShop, OptionKind.NECK, "Their collar", 100, ChargedPer.PIECE, 1));

		server.perform(put("/api/v1/catalogue-options/" + theirs.id())
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"name":"Mine now","standardPriceSen":1,"chargedPer":"piece","offered":true,\
						"sortOrder":1,"version":0}"""))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.refusal").value("not_found"));

		// Their row is untouched, and it never appears in this shop's list (SEC-2).
		assertThat(options.findById(theirs.id()).orElseThrow().name()).isEqualTo("Their collar");
		server.perform(get("/api/v1/catalogue-options").param("includeNotOffered", "true")
				.header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void an_empty_name_is_refused_and_names_the_field() throws Exception {
		String token = adminToken();

		server.perform(post("/api/v1/catalogue-options").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(optionJson("neck", "   ", 0, "piece", 1)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.refusal").value("invalid"))
				.andExpect(jsonPath("$.fields.name").exists());
	}

	@Test
	void the_list_comes_back_in_the_order_the_shop_set() throws Exception {
		String token = adminToken();
		options.saveAndFlush(new CatalogueOption(shopId, OptionKind.SIZE, "XL", 0, ChargedPer.PIECE, 3));
		options.saveAndFlush(new CatalogueOption(shopId, OptionKind.SIZE, "S", 0, ChargedPer.PIECE, 1));
		options.saveAndFlush(new CatalogueOption(shopId, OptionKind.SIZE, "M", 0, ChargedPer.PIECE, 2));

		server.perform(get("/api/v1/catalogue-options").param("kind", "size")
				.header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$[0].name").value("S"))
				.andExpect(jsonPath("$[1].name").value("M"))
				.andExpect(jsonPath("$[2].name").value("XL"));
	}

}
