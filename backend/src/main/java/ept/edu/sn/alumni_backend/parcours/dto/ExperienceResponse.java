package ept.edu.sn.alumni_backend.parcours.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeContrat;

public record ExperienceResponse(
    UUID id,
    String poste,
    String description,
    TypeContrat typeContrat,
    LocalDate dateDebut,
    LocalDate dateFin,
    boolean estStage,
    boolean enCours,
    UUID organismeId,
    String nomOrganisme,
    boolean etablissementEpt
) {}
