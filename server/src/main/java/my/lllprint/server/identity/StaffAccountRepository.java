package my.lllprint.server.identity;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffAccountRepository extends JpaRepository<StaffAccount, Long> {

	/**
	 * Within one shop a username is unique, by the constraint in V1. The shop is
	 * named here too, because every query names its shop without exception
	 * (D-M, SDD section 4).
	 */
	Optional<StaffAccount> findByShopIdAndUsername(Long shopId, String username);

	/**
	 * Signing in has to find the account before it knows which shop the person
	 * belongs to, so this is the one query that does not name a shop.
	 *
	 * <p>One shop is the scope today, so one username finds at most one account.
	 * When the system serves more than one shop, the sign-in request will have to
	 * name the shop, because a username is only unique within one (D-M).
	 */
	List<StaffAccount> findByUsername(String username);

}
