package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Liste définitive d'une offre (STA-04), avec les dates proposées par défaut pour un nouvel étudiant. */
public record ListeDefinitiveResponse(
    UUID offreId,
    String titreOffre,
    String organisme,
    String statutOffre,
    LocalDate dateLimiteCandidature,
    Integer nombrePlaces,
    Instant listePublieeLe,
    LocalDate dateDebutParDefaut,
    LocalDate dateFinParDefaut,
    List<LigneListeResponse> lignes
) {
}
