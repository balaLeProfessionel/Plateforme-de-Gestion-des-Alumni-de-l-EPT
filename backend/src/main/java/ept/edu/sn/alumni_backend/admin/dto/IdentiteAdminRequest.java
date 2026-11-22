package ept.edu.sn.alumni_backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Nom d'un administrateur, tel qu'il apparaît comme auteur au journal. */
public record IdentiteAdminRequest(
    @NotBlank(message = "Le prénom est obligatoire.") @Size(max = 100, message = "100 caractères au maximum.") String prenom,
    @NotBlank(message = "Le nom est obligatoire.") @Size(max = 100, message = "100 caractères au maximum.") String nom
) {
}
