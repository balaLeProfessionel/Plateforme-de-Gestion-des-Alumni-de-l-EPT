package ept.edu.sn.alumni_backend.stage.dto;

import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Offre saisie par l'administrateur Stages au nom d'un organisme (STA-01) : un organisme existant, ou un nouveau,
 * créé sans compte à partir de son nom.
 */
public record SaisieOffreAdminRequest(
    @NotNull(message = "Les informations de l'offre sont obligatoires.") @Valid OffreStageRequest offre,
    UUID organismeId,
    @Size(max = 150, message = "150 caractères au maximum.") String nomNouvelOrganisme
) {
}
