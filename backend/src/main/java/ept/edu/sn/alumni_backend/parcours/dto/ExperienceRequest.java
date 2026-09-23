package ept.edu.sn.alumni_backend.parcours.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeContrat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExperienceRequest(
    @NotBlank @Size(max = 255) String poste,
    @Size(max = 2000) String description,
    @NotNull TypeContrat typeContrat,
    @NotNull LocalDate dateDebut,
    LocalDate dateFin,
    boolean estStage,

    UUID organismeId,
    @Size(max = 255) String nomNouvelOrganisme
) {}
