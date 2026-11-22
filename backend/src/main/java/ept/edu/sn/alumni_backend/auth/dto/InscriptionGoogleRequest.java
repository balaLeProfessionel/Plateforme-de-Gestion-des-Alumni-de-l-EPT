package ept.edu.sn.alumni_backend.auth.dto;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Inscription avec Google : le jeton fournit l'adresse (vérifiée par Google), la personne complète le reste.
 * Pas de mot de passe : il pourra être choisi plus tard par « Mot de passe oublié ».
 */
public record InscriptionGoogleRequest(
    @NotBlank @Size(max = 4096) String credential,
    @NotBlank(message = "Le nom est obligatoire") @Size(max = 100) String nom,
    @NotBlank(message = "Le prénom est obligatoire") @Size(max = 100) String prenom,
    @NotNull(message = "Le rôle est obligatoire") TypeRole role,
    String telephone,
    Integer anneeSortie,
    String filiere,
    String nomOrganisme
) { }
