package ept.edu.sn.alumni_backend.mobilite.dto;

import ept.edu.sn.alumni_backend.mobilite.StatutCandidatureMobilite;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Décision du chef du service mobilité : RETENUE, LISTE_ATTENTE (rang facultatif, sinon en fin de liste) ou NON_RETENUE. */
public record DecisionCandidatureRequest(
    @NotNull(message = "La décision est obligatoire.") StatutCandidatureMobilite statut,
    @Min(value = 1, message = "Le rang commence à 1.") @Max(value = 500, message = "500 au plus.") Integer rang
) {
}
