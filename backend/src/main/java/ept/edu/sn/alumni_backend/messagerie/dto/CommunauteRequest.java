package ept.edu.sn.alumni_backend.messagerie.dto;

import ept.edu.sn.alumni_backend.messagerie.AccesCommunaute;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;
import ept.edu.sn.alumni_backend.messagerie.entity.Conversation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Création d'une communauté à rejoindre (ville, secteur, intérêt) par un administrateur de la plateforme. */
public record CommunauteRequest(
    @NotBlank(message = "Donnez un nom à la communauté")
    @Size(max = Conversation.LONGUEUR_MAX_NOM, message = "Le nom de la communauté fait au plus 80 caractères")
    String nom,
    @Size(max = Conversation.LONGUEUR_MAX_DESCRIPTION, message = "La description fait au plus 500 caractères")
    String description,
    @NotNull(message = "Choisissez la catégorie de la communauté")
    CategorieCommunaute categorie,
    AccesCommunaute acces
) {}
