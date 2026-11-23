package ept.edu.sn.alumni_backend.filiere.dto;

import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NomFiliereRequest(
    @NotBlank(message = "Le nom de la filière est obligatoire.")
    @Size(max = Filiere.LONGUEUR_NOM, message = "120 caractères au maximum.")
    String nom
) {
}
