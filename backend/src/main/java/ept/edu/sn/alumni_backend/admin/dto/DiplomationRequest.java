package ept.edu.sn.alumni_backend.admin.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Étudiants à faire passer alumni, avec leur année de sortie (leur promotion). */
public record DiplomationRequest(
    @NotEmpty(message = "Choisissez au moins un étudiant") @Size(max = 300) List<@NotNull UUID> ids,
    @NotNull(message = "L'année de sortie est obligatoire") @Min(1975) @Max(2200) Integer anneeSortie
) {
}
