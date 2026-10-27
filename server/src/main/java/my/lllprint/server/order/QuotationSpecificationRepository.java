package my.lllprint.server.order;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationSpecificationRepository extends JpaRepository<QuotationSpecification, Long> {

	List<QuotationSpecification> findByQuotationIdOrderBySortOrderAscIdAsc(Long quotationId);

	void deleteByQuotationId(Long quotationId);

}
