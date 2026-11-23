package ept.edu.sn.alumni_backend.mobilite.dto;

import java.util.List;
import java.util.UUID;

/** Flux d'une année universitaire : mobilités prévues, en cours ou terminées, par établissement et par sens. */
public record FluxResponse(String anneeUniversitaire, List<String> annees, List<Ligne> lignes, long sortantes, long entrantes) {
    public record Ligne(UUID organismeId, String organisme, long sortantes, long entrantes) {
    }
}
