package ept.edu.sn.alumni_backend.messagerie.dto;

import ept.edu.sn.alumni_backend.messagerie.RoleParticipant;
import jakarta.validation.constraints.NotNull;

/** Nommer un membre administrateur du groupe, ou lui retirer ce rôle. */
public record RoleParticipantRequest(@NotNull(message = "Choisissez un rôle") RoleParticipant role) {}
