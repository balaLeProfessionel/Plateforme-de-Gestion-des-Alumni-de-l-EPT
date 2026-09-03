package ept.edu.sn.alumni_backend.parcours.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeFormation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FormationRequest(
    @NotBlank String libelle,
    String description,
    @NotNull TypeFormation typeFormation,
    @NotNull LocalDate dateDebut,
    LocalDate dateFin, // null si formation en cours
    boolean estStage,

    UUID organismeId,
    String nomNouvelOrganisme
) {}
