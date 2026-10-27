package my.lllprint.server.order;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationGarmentGroupRepository extends JpaRepository<QuotationGarmentGroup, Long> {

	List<QuotationGarmentGroup> findByQuotationIdOrderBySortOrderAscIdAsc(Long quotationId);

	void deleteByQuotationId(Long quotationId);

}
