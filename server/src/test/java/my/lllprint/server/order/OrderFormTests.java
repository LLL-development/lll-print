package my.lllprint.server.order;

import my.lllprint.server.ApiTest;
import my.lllprint.server.catalogue.CatalogueOption;
import my.lllprint.server.catalogue.CatalogueOptionRepository;
import my.lllprint.server.catalogue.ChargedPer;
import my.lllprint.server.catalogue.CustomerPrice;
import my.lllprint.server.catalogue.CustomerPriceRepository;
import my.lllprint.server.catalogue.OptionKind;
import my.lllprint.server.contacts.Contact;
import my.lllprint.server.contacts.ContactRepository;
import my.lllprint.server.identity.StaffRole;

import org.junit.jupiter.api.BeforeEach;
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
 * Typing the real order through the real addresses, and getting RM 1,734.00
 * back out of the database.
 *
 * <p>This is check C-1 end to end, rather than on the arithmetic alone.
 */
class OrderFormTests extends ApiTest {

	@Autowired
	private CatalogueOptionRepository options;

	@Autowired
	private ContactRepository contacts;

	@Autowired
	private CustomerPriceRepository customerPrices;

	private String token;

	private Long cloth;

	private Long sublimation;

	private Long collarZip;

	private Long longSleeve;

	private Long sizeM;

	private Long kids;

	@BeforeEach
	void aShopThatSellsThings() throws Exception {
		account("admin-order", StaffRole.ADMIN);
		token = signIn("admin-order");

		cloth = option(OptionKind.MATERIAL, "EYELAT 170gsm", 2800, ChargedPer.PIECE);
		sublimation = option(OptionKind.PRINTING_METHOD, "Sublimation", 200, ChargedPer.PIECE);
		collarZip = option(OptionKind.NECK, "Collar Zip", 300, ChargedPer.PIECE);
		longSleeve = option(OptionKind.SLEEVE, "Long sleeve", 400, ChargedPer.ORDER);
		sizeM = option(OptionKind.SIZE, "M", 0, ChargedPer.PIECE);
		kids = option(OptionKind.SIZE, "Kids", -200, ChargedPer.PIECE);
	}

	private Long option(OptionKind kind, String name, long priceSen, ChargedPer chargedPer) {
		return options.saveAndFlush(new CatalogueOption(shopId, kind, name, priceSen, chargedPer, 1)).id();
	}

	private Long startOrder(String jobTitle) throws Exception {
		String reply = server.perform(post("/api/v1/quotations")
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"jobTitle\":\"" + jobTitle + "\"}"))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		int at = reply.indexOf("\"id\":") + 5;
		return Long.parseLong(reply.substring(at, reply.indexOf(',', at)));
	}

	/** One garment group of the real order: its sizes and how many of each. */
	private String groupJson(Long neckOptionId, Long sleeveOptionId, int small, int medium, int large,
			int extraLarge) {
		String neck = neckOptionId == null ? "null" : neckOptionId.toString();
		String sleeve = sleeveOptionId == null ? "null" : sleeveOptionId.toString();
		return """
				{"neckOptionId":%s,"sleeveOptionId":%s,"note":null,"sizes":[
				{"catalogueOptionId":%d,"quantity":%d},
				{"catalogueOptionId":%d,"quantity":%d},
				{"catalogueOptionId":%d,"quantity":%d},
				{"catalogueOptionId":%d,"quantity":%d}]}"""
				.formatted(neck, sleeve, sizeM, small, sizeM, medium, sizeM, large, sizeM, extraLarge);
	}

	/** KEM PENGAKAP: 55 helai, five garment groups, twenty size entries. */
	private String theRealOrder(Long contactId, long version) {
		String contact = contactId == null ? "null" : contactId.toString();
		return """
				{"jobTitle":"KEM PENGAKAP","contactId":%s,"dateWanted":"2026-10-05","sourceNote":null,
				"shippingChargeSen":0,"onePriceOverrideSen":null,
				"specifications":[
				  {"kind":"material","catalogueOptionId":%d},
				  {"kind":"printing_method","catalogueOptionId":%d}],
				"garmentGroups":[%s,%s,%s,%s,%s],
				"charges":[{"name":"Artwork setup","amountSen":5000,"chargedPer":"order"}],
				"version":%d}"""
				.formatted(contact, cloth, sublimation,
						groupJson(collarZip, longSleeve, 3, 4, 2, 1),
						groupJson(null, longSleeve, 2, 5, 3, 1),
						groupJson(null, null, 3, 4, 3, 1),
						groupJson(null, null, 2, 5, 3, 1),
						groupJson(null, null, 3, 5, 3, 1),
						version);
	}

	private String save(Long orderId, String body) throws Exception {
		return server.perform(put("/api/v1/quotations/" + orderId)
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(body))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
	}

	@Test
	void the_real_order_typed_through_the_api_comes_to_one_thousand_seven_hundred_and_thirty_four_ringgit()
			throws Exception {
		Long orderId = startOrder("KEM PENGAKAP");

		save(orderId, theRealOrder(null, 0));

		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pieces").value(55))
				.andExpect(jsonPath("$.basePricePerPieceSen").value(2800))
				.andExpect(jsonPath("$.grandTotalSen").value(173400))
				.andExpect(jsonPath("$.workings[0].what").value("EYELAT 170gsm"))
				.andExpect(jsonPath("$.workings[0].amountSen").value(154000));
	}

	@Test
	void the_order_is_saved_in_three_levels_and_read_back_the_same_way() throws Exception {
		Long orderId = startOrder("KEM PENGAKAP");

		save(orderId, theRealOrder(null, 0));

		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.specifications.length()").value(2))
				.andExpect(jsonPath("$.garmentGroups.length()").value(5))
				.andExpect(jsonPath("$.garmentGroups[0].sizes.length()").value(4))
				.andExpect(jsonPath("$.garmentGroups[0].neck.name").value("Collar Zip"))
				.andExpect(jsonPath("$.charges[0].name").value("Artwork setup"));
	}

	@Test
	void an_order_takes_the_next_number_and_two_orders_never_share_one() throws Exception {
		String first = server.perform(post("/api/v1/quotations").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"jobTitle\":\"First\"}"))
				.andReturn().getResponse().getContentAsString();
		String second = server.perform(post("/api/v1/quotations").header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content("{\"jobTitle\":\"Second\"}"))
				.andReturn().getResponse().getContentAsString();

		assertThat(first).contains("\"number\":\"Q-0001\"");
		assertThat(second).contains("\"number\":\"Q-0002\"");
	}

	@Test
	void the_customer_is_copied_onto_the_order_so_correcting_them_later_changes_nothing() throws Exception {
		Contact customer = contacts.saveAndFlush(
				new Contact(shopId, "Cikgu Rahim", "0123456789", null, null, "pays late"));
		Long orderId = startOrder("KEM PENGAKAP");

		save(orderId, theRealOrder(customer.id(), 0));

		// The customer is renamed afterwards (FR-9.4).
		customer.change("Cikgu Rahim bin Ali", "0123456789", null, null, "pays late");
		contacts.flush();

		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.customerName").value("Cikgu Rahim"));
	}

	@Test
	void a_price_set_for_this_customer_is_used_instead_of_the_standard_one() throws Exception {
		Contact customer = contacts.saveAndFlush(new Contact(shopId, "Regular", "0123456789", null, null, null));
		// This customer pays RM 26.00 for the cloth, not RM 28.00 (FR-12.6,
		// FR-1.5). The cloth carries the base price, so their whole base changes.
		customerPrices.saveAndFlush(new CustomerPrice(shopId, customer.id(), cloth, 2600));
		Long orderId = startOrder("KEM PENGAKAP");

		save(orderId, theRealOrder(customer.id(), 0));

		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.basePricePerPieceSen").value(2600))
				// 55 x RM 26.00 is RM 110.00 less than before.
				.andExpect(jsonPath("$.grandTotalSen").value(173400 - 55 * 200));
	}

	@Test
	void a_one_off_price_typed_for_this_order_beats_the_customers_own_price() throws Exception {
		Contact customer = contacts.saveAndFlush(new Contact(shopId, "Regular", "0123456789", null, null, null));
		customerPrices.saveAndFlush(new CustomerPrice(shopId, customer.id(), cloth, 2600));
		Long orderId = startOrder("KEM PENGAKAP");

		String typed = theRealOrder(customer.id(), 0)
				.replace("{\"kind\":\"material\",\"catalogueOptionId\":" + cloth + "}",
						"{\"kind\":\"material\",\"catalogueOptionId\":" + cloth + ",\"onePriceSen\":3000}");

		save(orderId, typed);

		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.basePricePerPieceSen").value(3000));
	}

	@Test
	void a_price_the_browser_sends_for_an_option_is_ignored_and_the_catalogue_is_believed() throws Exception {
		Long orderId = startOrder("KEM PENGAKAP");

		// A tampered request claiming Collar Zip is free. The server reads the
		// price from the catalogue, so this reaches nothing (SEC-2, SEC-7).
		String typed = theRealOrder(null, 0).replace("\"neckOptionId\":" + collarZip,
				"\"neckOptionId\":" + collarZip + ",\"neckName\":\"Free zip\",\"neckPriceSen\":0");

		save(orderId, typed);

		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.grandTotalSen").value(173400))
				.andExpect(jsonPath("$.garmentGroups[0].neck.name").value("Collar Zip"));
	}

	@Test
	void an_option_worth_less_brings_the_order_down() throws Exception {
		Long orderId = startOrder("Kids order");

		String typed = """
				{"jobTitle":"Kids order","shippingChargeSen":0,
				"specifications":[{"kind":"material","catalogueOptionId":%d}],
				"garmentGroups":[{"sizes":[{"catalogueOptionId":%d,"quantity":10}]}],
				"charges":[],"version":0}""".formatted(cloth, kids);

		save(orderId, typed);

		// 10 x RM 28.00 less 10 x RM 2.00 (FR-12.2, check C-2).
		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.grandTotalSen").value(26000));
	}

	@Test
	void saving_with_an_old_version_is_refused_rather_than_overwriting() throws Exception {
		Long orderId = startOrder("KEM PENGAKAP");
		save(orderId, theRealOrder(null, 0));

		server.perform(put("/api/v1/quotations/" + orderId)
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON)
				.content(theRealOrder(null, 0)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.refusal").value("changed_by_someone_else"));
	}

	@Test
	void an_option_from_another_shop_cannot_be_put_on_this_order() throws Exception {
		database.sql("INSERT INTO shop (name) VALUES ('Another shop')").update();
		Long otherShop = database.sql("SELECT id FROM shop ORDER BY id DESC LIMIT 1").query(Long.class).single();
		Long theirCloth = options.saveAndFlush(
				new CatalogueOption(otherShop, OptionKind.MATERIAL, "Their cloth", 9900, ChargedPer.PIECE, 1)).id();
		Long orderId = startOrder("KEM PENGAKAP");

		String typed = """
				{"jobTitle":"KEM PENGAKAP","shippingChargeSen":0,
				"specifications":[{"kind":"material","catalogueOptionId":%d}],
				"garmentGroups":[],"charges":[],"version":0}""".formatted(theirCloth);

		server.perform(put("/api/v1/quotations/" + orderId)
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(typed))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.refusal").value("invalid"));
	}

	@Test
	void a_charge_below_zero_is_refused_because_that_would_be_a_discount() throws Exception {
		Long orderId = startOrder("KEM PENGAKAP");

		String typed = """
				{"jobTitle":"KEM PENGAKAP","shippingChargeSen":0,
				"specifications":[{"kind":"material","catalogueOptionId":%d}],
				"garmentGroups":[{"sizes":[{"catalogueOptionId":%d,"quantity":1}]}],
				"charges":[{"name":"Goodwill","amountSen":-500,"chargedPer":"order"}],
				"version":0}""".formatted(cloth, sizeM);

		server.perform(put("/api/v1/quotations/" + orderId)
				.header("Authorization", "Bearer " + token)
				.contentType(MediaType.APPLICATION_JSON).content(typed))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.refusal").value("invalid"));
	}

	@Test
	void a_staff_account_cannot_type_an_order_because_that_is_admins_work() throws Exception {
		account("staff-order", StaffRole.STAFF);
		String staffToken = signIn("staff-order");

		server.perform(post("/api/v1/quotations").header("Authorization", "Bearer " + staffToken)
				.contentType(MediaType.APPLICATION_JSON).content("{\"jobTitle\":\"Mine now\"}"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.refusal").value("not_allowed"));
	}

	@Test
	void a_signed_out_request_reaches_no_order() throws Exception {
		server.perform(get("/api/v1/quotations"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.refusal").value("not_signed_in"));
	}

	@Test
	void saving_the_same_order_twice_replaces_its_levels_rather_than_doubling_them() throws Exception {
		Long orderId = startOrder("KEM PENGAKAP");
		String afterFirst = save(orderId, theRealOrder(null, 0));

		int at = afterFirst.lastIndexOf("\"version\":") + 10;
		long version = Long.parseLong(afterFirst.substring(at).replaceAll("[^0-9].*$", ""));
		save(orderId, theRealOrder(null, version));

		server.perform(get("/api/v1/quotations/" + orderId).header("Authorization", "Bearer " + token))
				.andExpect(jsonPath("$.garmentGroups.length()").value(5))
				.andExpect(jsonPath("$.specifications.length()").value(2))
				.andExpect(jsonPath("$.grandTotalSen").value(173400));
	}

}
