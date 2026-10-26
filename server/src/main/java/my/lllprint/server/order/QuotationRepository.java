package my.lllprint.server.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/** Every query names the shop, because the shop comes from the signed-in account (SEC-2). */
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

	Optional<Quotation> findByIdAndShopId(Long id, Long shopId);

	List<Quotation> findByShopIdOrderByIdDesc(Long shopId);

}
