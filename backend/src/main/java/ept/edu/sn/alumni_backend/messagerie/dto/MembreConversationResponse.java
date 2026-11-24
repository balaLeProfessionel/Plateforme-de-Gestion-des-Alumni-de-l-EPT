package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;

/** Participant tel qu'affiché : jamais d'e-mail ni de téléphone. */
public record MembreConversationResponse(UUID id, String prenom, String nom, String nomAffiche, String urlPhoto,
    TypeRole role, RoleParticipant roleParticipant) {}
