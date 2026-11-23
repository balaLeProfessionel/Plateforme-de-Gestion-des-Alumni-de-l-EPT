package ept.edu.sn.alumni_backend.mobilite.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mobilite.TypeMobilite;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Un étudiant accueilli à l'EPT (mobilité entrante) : identité et programme, sans pièce justificative. */
public record AccueilRequest(
    @NotBlank(message = "Le prénom est obligatoire.") @Size(max = 100, message = "100 caractères au maximum.") String prenom,
    @NotBlank(message = "Le nom est obligatoire.") @Size(max = 100, message = "100 caractères au maximum.") String nom,
    @Email(message = "Adresse e-mail invalide.") @Size(max = 150, message = "150 caractères au maximum.") String email,
    @NotBlank(message = "Le programme d'origine est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String programmeOrigine,
    @NotNull(message = "La filière d'accueil est obligatoire.") UUID filiereAccueilId,
    @NotNull(message = "Le type de mobilité est obligatoire.") TypeMobilite type,
    @NotBlank(message = "L'année universitaire est obligatoire.")
    @Pattern(regexp = "\\d{4}-\\d{4}", message = "L'année universitaire s'écrit « 2027-2028 ».") String anneeUniversitaire,
    LocalDate dateDebut,
    LocalDate dateFin
) {
}
