package ept.edu.sn.alumni_backend.messagerie.dto;

import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Modification d'un groupe : un champ absent ({@code null}) reste tel quel. Une description vide l'efface ;
 * le nom, lui, ne peut pas être vide.
 */
public record ModificationGroupeRequest(
    @Pattern(regexp = "(?s).*\\S.*", message = "Donnez un nom au groupe")
    @Size(max = Conversation.LONGUEUR_MAX_NOM, message = "Le nom du groupe fait au plus 80 caractères")
    String nom,
    @Size(max = Conversation.LONGUEUR_MAX_DESCRIPTION, message = "La description fait au plus 500 caractères")
    String description
) {}
