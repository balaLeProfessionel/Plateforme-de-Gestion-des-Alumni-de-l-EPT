package ept.edu.sn.alumni_backend.messagerie.dto;

import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RenommageGroupeRequest(
    @NotBlank(message = "Donnez un nom au groupe")
    @Size(max = Conversation.LONGUEUR_MAX_NOM, message = "Le nom du groupe fait au plus 80 caractères")
    String nom
) {}
