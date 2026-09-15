package ept.edu.sn.alumni_backend.parcours.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeContrat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExperienceRequest(
    @NotBlank String poste,
    @NotNull TypeContrat typeContrat,
    @NotNull LocalDate dateDebut,
    LocalDate dateFin,
    boolean estStage,

    UUID organismeId,
    String nomNouvelOrganisme
) {}