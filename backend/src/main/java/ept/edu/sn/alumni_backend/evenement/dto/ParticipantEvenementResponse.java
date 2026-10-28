package ept.edu.sn.alumni_backend.evenement.dto;

import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeRole;

public record ParticipantEvenementResponse(
    UUID id,
    String nom,
    String prenom,
    TypeRole role,
    String urlPhoto
) {}
