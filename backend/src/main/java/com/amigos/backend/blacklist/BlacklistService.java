package com.amigos.backend.blacklist;

import com.amigos.backend.blacklist.dto.BlacklistRequest;
import com.amigos.backend.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class BlacklistService {

    private final BlacklistRepository blacklistRepository;

    public BlacklistService(BlacklistRepository blacklistRepository) {
        this.blacklistRepository = blacklistRepository;
    }

    public BlacklistEntry add(BlacklistRequest request) {
        BlacklistEntry entry = new BlacklistEntry();
        entry.setPlateNumber(request.plateNumber());
        entry.setCityId(request.cityId());
        entry.setReason(request.reason());
        entry.setAddedBy(request.addedBy());
        entry.setExpiresAt(request.expiresAt());
        return blacklistRepository.save(entry);
    }

    public List<BlacklistEntry> list() {
        return blacklistRepository.findAll();
    }

    public void remove(String plateNumber) {
        if (!blacklistRepository.existsById(plateNumber)) {
            throw new ResourceNotFoundException("Blacklist entry not found: " + plateNumber);
        }
        blacklistRepository.deleteById(plateNumber);
    }

    // called by AlertConsumer on every incoming detection
    public boolean isBlacklisted(String plateNumber) {
        Optional<BlacklistEntry> entry = blacklistRepository.findById(plateNumber);
        if (entry.isEmpty()) return false;

        Instant expiresAt = entry.get().getExpiresAt();
        return expiresAt == null || expiresAt.isAfter(Instant.now());
    }

    public Optional<BlacklistEntry> getReason(String plateNumber) {
        return blacklistRepository.findById(plateNumber);
    }
}
