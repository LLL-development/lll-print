package my.lllprint.server.order;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationSizeRepository extends JpaRepository<QuotationSize, Long> {

	List<QuotationSize> findByGarmentGroupIdOrderBySortOrderAscIdAsc(Long garmentGroupId);

	void deleteByGarmentGroupId(Long garmentGroupId);

}
