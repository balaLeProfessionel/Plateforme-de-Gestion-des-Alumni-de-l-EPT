package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.Instant;
import java.util.UUID;

/** Une étape du programme vue depuis un mentorat : {@code franchieLe} est null tant qu'elle n'est pas validée. */
public record EtapeSuivieResponse(
    UUID id,
    short ordre,
    String titre,
    String description,
    Instant franchieLe,
    String valideePar,
    String commentaire
) {
}
