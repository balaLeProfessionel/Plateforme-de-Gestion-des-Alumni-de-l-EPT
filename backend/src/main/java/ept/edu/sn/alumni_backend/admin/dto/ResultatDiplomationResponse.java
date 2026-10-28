package ept.edu.sn.alumni_backend.admin.dto;

import java.util.List;
import java.util.UUID;

/** Nombre d'étudiants devenus alumni, et ceux laissés de côté avec la raison. */
public record ResultatDiplomationResponse(int diplomes, List<Ignore> ignores) {
    public record Ignore(UUID id, String nom, String raison) {
    }
}
