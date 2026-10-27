package my.lllprint.server.identity;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffGrantRepository extends JpaRepository<StaffGrant, Long> {

	/** Read on every request, by the account key, which is what the V1 index is for (D-AF). */
	List<StaffGrant> findByStaffAccountId(Long staffAccountId);

}
