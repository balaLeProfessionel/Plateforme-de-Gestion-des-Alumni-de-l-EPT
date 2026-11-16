package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.EtatEcriture;
import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;

/**
 * Ligne de la liste des conversations. {@code nom} : nom du groupe, ou de l'interlocuteur d'une conversation directe.
 * {@code interlocuteur} : l'autre personne d'une conversation directe, absent pour un groupe.
 * {@code urlPhoto} : photo du groupe, absente pour une conversation directe (on montre celle de l'interlocuteur).
 * {@code dernierMessage} : absent tant qu'aucun message n'a été envoyé.
 */
public record ConversationResponse(UUID id, TypeConversation type, String nom, MembreConversationResponse interlocuteur,
    String urlPhoto, int nombreParticipants, RoleParticipant monRole, EtatEcriture ecriture,
    ApercuMessageResponse dernierMessage, long nombreNonLus, Instant dernierMessageLe) {}
