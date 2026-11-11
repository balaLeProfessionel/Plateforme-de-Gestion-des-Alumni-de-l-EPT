package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Ligne de la liste définitive, vue par l'administrateur Stages : l'étudiant, s'il a postulé et l'avis de
 * l'organisme sur sa candidature, les dates du stage et son statut.
 */
public record LigneListeResponse(
    UUID id,
    CandidatureRecueResponse.Etudiant etudiant,
    String email,
    UUID candidatureId,
    /** Avis de l'organisme sur la candidature ; null si l'étudiant n'a pas postulé. */
    String avisOrganisme,
    String statut,
    LocalDate dateDebut,
    LocalDate dateFin,
    String motif,
    Instant confirmeLe,
    Instant annuleLe
) {
}
