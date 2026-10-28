package ept.edu.sn.alumni_backend.auth.dto;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreerCompteRequest(
    @NotBlank(message = "Le nom est obligatoire") @Size(max = 100) String nom,
    @NotBlank(message = "Le prénom est obligatoire") @Size(max = 100) String prenom,
    @Email(message = "Format d'email invalide") @NotBlank(message = "L'email est obligatoire") String email,
    @NotNull(message = "Le rôle est obligatoire") TypeRole role,
    @Min(value = 1975, message = "Année d'entrée invalide") @Max(value = 2200, message = "Année d'entrée invalide") Integer anneeEntree,
    @Size(max = 120) String filiere,
    @Min(value = 1975, message = "Année de sortie invalide") @Max(value = 2200, message = "Année de sortie invalide") Integer anneeSortie
) {
    /** Compte d'étudiant ou d'un autre membre sans année de sortie connue. */
    public CreerCompteRequest(String nom, String prenom, String email, TypeRole role, Integer anneeEntree, String filiere) {
        this(nom, prenom, email, role, anneeEntree, filiere, null);
    }
}