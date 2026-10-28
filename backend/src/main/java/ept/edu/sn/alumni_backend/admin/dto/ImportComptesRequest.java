package ept.edu.sn.alumni_backend.admin.dto;

import java.util.List;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Lignes d'un fichier de promotion ; chacune est validée à part, pour un rapport ligne par ligne. */
public record ImportComptesRequest(
    @NotNull(message = "Choisissez le type des comptes") TypeRole role,
    @NotEmpty(message = "Le fichier ne contient aucune ligne") @Size(max = 300, message = "300 lignes au plus par import") List<@NotNull Ligne> lignes
) {
    public record Ligne(String prenom, String nom, String email, String filiere, Integer anneeEntree, Integer anneeSortie) {
    }
}
