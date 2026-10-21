package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeRole;

public record ParticipantMentoratResponse(
    UUID id,
    String nom,
    String prenom,
    String urlPhoto,
    String posteActuel,
    String filiere,
    Integer anneeSortie,
    TypeRole role
) {
}
