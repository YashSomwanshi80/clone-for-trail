package com.amigos.backend.audit;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void logTrajectoryQuery(String actor, String plateNumber) {
        AuditLog log = new AuditLog();
        log.setActor(actor);
        log.setAction("TRAJECTORY_QUERY");
        log.setTargetPlate(plateNumber);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAll() {
        return auditLogRepository.findAll();
    }
}
