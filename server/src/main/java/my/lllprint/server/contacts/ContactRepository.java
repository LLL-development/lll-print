package my.lllprint.server.contacts;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/** Every query names the shop, because the shop comes from the signed-in account (SEC-2). */
public interface ContactRepository extends JpaRepository<Contact, Long> {

	Optional<Contact> findByIdAndShopId(Long id, Long shopId);

	List<Contact> findByShopIdOrderByNameAsc(Long shopId);

	List<Contact> findByShopIdAndNameContainingIgnoreCaseOrderByNameAsc(Long shopId, String partOfTheName);

}
