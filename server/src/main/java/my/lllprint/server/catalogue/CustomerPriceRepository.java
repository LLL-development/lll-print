package my.lllprint.server.catalogue;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerPriceRepository extends JpaRepository<CustomerPrice, Long> {

	/** Read once per order save, not once per line, so one customer is one query. */
	List<CustomerPrice> findByShopIdAndContactId(Long shopId, Long contactId);

}
