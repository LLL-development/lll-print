package my.lllprint.server.catalogue;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Every query names the shop, without exception, because the server fills the
 * shop in from the signed-in account and never from what the browser sent
 * (SEC-2, FR-12.8).
 */
public interface CatalogueOptionRepository extends JpaRepository<CatalogueOption, Long> {

	Optional<CatalogueOption> findByIdAndShopId(Long id, Long shopId);

	List<CatalogueOption> findByShopIdOrderByKindAscSortOrderAscNameAsc(Long shopId);

	List<CatalogueOption> findByShopIdAndOfferedOrderByKindAscSortOrderAscNameAsc(Long shopId, boolean offered);

	List<CatalogueOption> findByShopIdAndKindOrderBySortOrderAscNameAsc(Long shopId, OptionKind kind);

	List<CatalogueOption> findByShopIdAndKindAndOfferedOrderBySortOrderAscNameAsc(Long shopId, OptionKind kind,
			boolean offered);

	boolean existsByShopIdAndKindAndName(Long shopId, OptionKind kind, String name);

}
