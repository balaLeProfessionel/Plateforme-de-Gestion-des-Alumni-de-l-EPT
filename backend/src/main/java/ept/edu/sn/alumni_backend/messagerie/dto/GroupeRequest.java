package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.Set;
import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Création d'un groupe : le créateur en devient administrateur ; la liste des membres peut être vide. */
public record GroupeRequest(
    @NotBlank(message = "Donnez un nom au groupe")
    @Size(max = Conversation.LONGUEUR_MAX_NOM, message = "Le nom du groupe fait au plus 80 caractères")
    String nom,
    @Size(max = 50, message = "Ajoutez au plus 50 membres à la fois")
    Set<@NotNull UUID> membreIds
) {}
