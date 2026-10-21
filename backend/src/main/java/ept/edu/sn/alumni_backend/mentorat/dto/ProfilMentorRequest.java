package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProfilMentorRequest(
    @Size(max = 600) String presentation,
    @NotNull Boolean disponible,
    @Min(1) @Max(10) int capaciteMax,
    @NotEmpty(message = "Choisissez au moins un domaine")
    @Size(max = 5, message = "Choisissez au plus 5 domaines")
    Set<@NotNull UUID> domaineIds
) {
}
