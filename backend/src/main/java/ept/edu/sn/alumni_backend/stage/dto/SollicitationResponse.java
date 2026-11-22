package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Sollicitation envoyée ; destinataires vide dans l'historique paginé, rempli dans le détail. */
public record SollicitationResponse(
    UUID id,
    String type,
    String objet,
    String message,
    int nombreDestinataires,
    List<DestinataireSollicitation> destinataires,
    String envoyeePar,
    Instant envoyeeLe
) {
    /** Organisme sollicité, ou proposé à la sollicitation (avec l'adresse qui recevra le message). */
    public record DestinataireSollicitation(UUID organismeId, String nom, String email) {
    }
}
