package com.amigos.backend.blacklist;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlacklistRepository extends JpaRepository<BlacklistEntry, String> {
    List<BlacklistEntry> findByCityId(String cityId);
}
