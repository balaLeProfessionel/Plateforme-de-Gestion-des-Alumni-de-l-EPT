package ept.edu.sn.alumni_backend.stage.dto;

import ept.edu.sn.alumni_backend.stage.entity.ConventionStage;
import jakarta.validation.constraints.Size;

/** Clauses de la convention saisies par l'administrateur Stages (STA-05). */
public record ConventionRequest(
    @Size(max = ConventionStage.LONGUEUR_TEXTE) String assurance,
    @Size(max = ConventionStage.LONGUEUR_TEXTE) String indemnite,
    @Size(max = ConventionStage.LONGUEUR_TEXTE) String logement,
    boolean clauseConfidentialite
) {
}
