package ept.edu.sn.alumni_backend.mobilite.dto;

import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Mobilité entrante saisie par le chef du service mobilité, pour un établissement existant ou nouveau. */
public record SaisieAccueilRequest(
    @NotNull(message = "Les informations de l'étudiant sont obligatoires.") @Valid AccueilRequest accueil,
    UUID organismeId,
    @Size(max = 150, message = "150 caractères au maximum.") String nomNouvelOrganisme
) {
}
