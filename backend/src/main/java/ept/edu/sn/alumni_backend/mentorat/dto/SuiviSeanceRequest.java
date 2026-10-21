package ept.edu.sn.alumni_backend.mentorat.dto;

import ept.edu.sn.alumni_backend.mentorat.StatutSeance;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Passage d'une séance à « réalisée » ou « annulée », avec son compte rendu. */
public record SuiviSeanceRequest(
    @NotNull StatutSeance statut,
    @Size(max = 4000) String compteRendu
) {
}
