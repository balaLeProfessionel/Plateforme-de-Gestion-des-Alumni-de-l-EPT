package ept.edu.sn.alumni_backend.parcours.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeFormation;

public record FormationResponse(
    UUID id,
    String libelle,
    String description,
    TypeFormation typeFormation,
    LocalDate dateDebut,
    LocalDate dateFin,
    boolean estStage,
    boolean enCours,
    UUID organismeId,
    String nomOrganisme,
    boolean etablissementEpt
) {}
