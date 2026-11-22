package ept.edu.sn.alumni_backend.mobilite.dto;

import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Offre publiée par le chef du service mobilité au nom d'un établissement : un organisme existant, ou un nouveau, créé
 * sans compte à partir de son nom.
 */
public record SaisieOffreMobiliteRequest(
    @NotNull(message = "Les informations de l'offre sont obligatoires.") @Valid OffreMobiliteRequest offre,
    UUID organismeId,
    @Size(max = 150, message = "150 caractères au maximum.") String nomNouvelOrganisme
) {
}
