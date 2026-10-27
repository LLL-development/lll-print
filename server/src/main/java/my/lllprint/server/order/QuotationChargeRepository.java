package my.lllprint.server.order;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationChargeRepository extends JpaRepository<QuotationCharge, Long> {

	List<QuotationCharge> findByQuotationIdOrderBySortOrderAscIdAsc(Long quotationId);

	void deleteByQuotationId(Long quotationId);

}
