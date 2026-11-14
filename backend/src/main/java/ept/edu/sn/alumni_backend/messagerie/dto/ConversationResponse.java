package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;

/**
 * Ligne de la liste des conversations. {@code nom} : nom du groupe, ou de l'interlocuteur d'une conversation directe.
 * {@code interlocuteur} : l'autre personne d'une conversation directe, absent pour un groupe.
 * {@code dernierMessage} : absent tant qu'aucun message n'a été envoyé.
 */
public record ConversationResponse(UUID id, TypeConversation type, String nom, MembreConversationResponse interlocuteur,
    int nombreParticipants, RoleParticipant monRole, ApercuMessageResponse dernierMessage, long nombreNonLus,
    Instant dernierMessageLe) {}
