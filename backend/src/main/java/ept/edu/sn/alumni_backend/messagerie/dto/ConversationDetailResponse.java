package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import ept.edu.sn.alumni_backend.messagerie.TypeConversation;

public record ConversationDetailResponse(UUID id, TypeConversation type, String nom, RoleParticipant monRole,
    Instant creeLe, List<MembreConversationResponse> participants) {}
