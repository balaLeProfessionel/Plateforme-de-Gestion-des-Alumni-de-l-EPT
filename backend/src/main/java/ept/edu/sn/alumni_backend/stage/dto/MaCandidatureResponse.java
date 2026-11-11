package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Candidature vue par l'étudiant qui l'a envoyée : jamais l'avis de l'organisme. */
public record MaCandidatureResponse(
    UUID id,
    UUID offreId,
    String titreOffre,
    String organisme,
    LocalDate dateLimiteCandidature,
    boolean candidaturesOuvertes,
    String statut,
    String lettreMotivation,
    String nomCv,
    Instant envoyeeLe,
    Instant retireeLe
) {
}
