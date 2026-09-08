package com.amigos.backend.blacklist;

import com.amigos.backend.blacklist.dto.BlacklistRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/blacklist")
public class BlacklistController {

    private final BlacklistService blacklistService;

    public BlacklistController(BlacklistService blacklistService) {
        this.blacklistService = blacklistService;
    }

    @PostMapping
    public ResponseEntity<BlacklistEntry> add(@Valid @RequestBody BlacklistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(blacklistService.add(request));
    }

    @GetMapping
    public List<BlacklistEntry> list() {
        return blacklistService.list();
    }

    @DeleteMapping("/{plateNumber}")
    public ResponseEntity<Void> remove(@PathVariable String plateNumber) {
        blacklistService.remove(plateNumber);
        return ResponseEntity.noContent().build();
    }
}
