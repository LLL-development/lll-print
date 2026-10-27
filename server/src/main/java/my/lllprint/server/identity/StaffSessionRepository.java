package my.lllprint.server.identity;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffSessionRepository extends JpaRepository<StaffSession, Long> {

	Optional<StaffSession> findByTokenHash(String tokenHash);

}
