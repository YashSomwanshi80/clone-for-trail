package com.amigos.backend.media;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MediaRepository extends JpaRepository<Media, String> {
    List<Media> findBySourceType(Media.SourceType sourceType);
    List<Media> findByCityId(String cityId);
}
