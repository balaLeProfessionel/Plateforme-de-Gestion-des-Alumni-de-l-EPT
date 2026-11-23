package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.AccesCommunaute;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;
import ept.edu.sn.alumni_backend.messagerie.EtatEcriture;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;

/**
 * {@code description} et {@code urlPhoto} : ceux du groupe, toujours absents pour une conversation directe.
 * {@code categorie} et {@code acces} : remplis pour une communauté seulement.
 */
public record ConversationDetailResponse(UUID id, TypeConversation type, String nom, String description, String urlPhoto,
    RoleParticipant monRole, EtatEcriture ecriture, Instant creeLe, List<MembreConversationResponse> participants,
    CategorieCommunaute categorie, AccesCommunaute acces) {}
