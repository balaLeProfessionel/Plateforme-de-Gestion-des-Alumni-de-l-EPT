package ept.edu.sn.alumni_backend.evenement.dto;

import java.time.Instant;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record EvenementRequest(
    @NotBlank @Size(max = 120) String titre,
    @NotBlank @Size(max = 5000) String description,
    @NotBlank @Size(max = 200) String lieu,
    @NotNull Instant dateDebut,
    @NotNull Instant dateFin,
    @NotNull AudienceEvenement audience,
    @Positive Integer nombrePlaces
) {
    @AssertTrue(message = "La date de fin doit être postérieure à la date de début")
    public boolean isChronologieValide() {
        return dateDebut == null || dateFin == null || dateFin.isAfter(dateDebut);
    }
}
