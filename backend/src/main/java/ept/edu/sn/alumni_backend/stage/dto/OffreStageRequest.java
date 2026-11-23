package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;

import ept.edu.sn.alumni_backend.stage.TypeStage;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Champs d'une offre (STA-01) : titre, description, compétences, durée, type et date limite sont obligatoires. */
public record OffreStageRequest(
    @NotBlank(message = "Le titre est obligatoire.") @Size(max = 150, message = "150 caractères au maximum.") String titre,
    @NotBlank(message = "La description est obligatoire.") @Size(max = 5000, message = "5000 caractères au maximum.") String description,
    @NotBlank(message = "Les compétences attendues sont obligatoires.") @Size(max = 1000, message = "1000 caractères au maximum.") String competences,
    @NotNull(message = "La durée est obligatoire.") @Min(value = 1, message = "Au moins 1 mois.") @Max(value = 24, message = "24 mois au maximum.") Integer dureeMois,
    @NotNull(message = "Le type de stage est obligatoire.") TypeStage typeStage,
    @Size(max = 150, message = "150 caractères au maximum.") String lieu,
    LocalDate dateDebutPrevue,
    @Min(value = 1, message = "Au moins 1 place.") @Max(value = 100, message = "100 places au maximum.") Integer nombrePlaces,
    @NotNull(message = "La date limite de candidature est obligatoire.") LocalDate dateLimiteCandidature
) {
}
