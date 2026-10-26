package my.lllprint.server.order;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface DocumentNumberRepository extends JpaRepository<DocumentNumber, Long> {

	/**
	 * Locked while the number is taken, so two orders started at the same moment
	 * queue rather than both read the same last number (D-X).
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	Optional<DocumentNumber> findByShopIdAndKind(Long shopId, String kind);

}
