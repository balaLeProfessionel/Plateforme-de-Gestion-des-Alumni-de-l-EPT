package ept.edu.sn.alumni_backend.admin.dto;

import java.time.Instant;
import java.util.UUID;

/** Une décision du journal d'administration, avec son auteur et le compte concerné. */
public record EntreeJournalResponse(
    UUID id,
    String type,
    String motif,
    String details,
    Instant dateAction,
    String auteur,
    UUID cibleId,
    String cibleNom,
    String cibleRole
) {
}
