package ept.edu.sn.alumni_backend.emploi.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Candidature vue par son auteur (#222) : statut, CV, lettre et réponses ; jamais de note du recruteur. */
public record MaCandidatureEmploiResponse(
    UUID id,
    UUID offreId,
    String titreOffre,
    String entreprise,
    LocalDate dateExpiration,
    boolean offreExpiree,
    String statut,
    String nomCv,
    /** Faux une fois le CV effacé après la durée de conservation. */
    boolean cvDisponible,
    String lettreMotivation,
    List<Reponse> reponses,
    Instant envoyeeLe,
    Instant retireeLe,
    /** Le candidat peut encore la retirer : reçue, pas encore traitée. */
    boolean retirable,
    /** Statuts par lesquels la candidature est passée, dans l'ordre : le traitement peut sauter des étapes. */
    List<String> statutsAtteints
) {
    public record Reponse(UUID questionId, String intitule, String valeur) {
    }
}
