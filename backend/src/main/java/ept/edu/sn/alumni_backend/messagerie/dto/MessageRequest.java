package ept.edu.sn.alumni_backend.messagerie.dto;

import ept.edu.sn.alumni_backend.messagerie.entity.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageRequest(
    @NotBlank(message = "Écrivez un message")
    @Size(max = Message.LONGUEUR_MAX_CONTENU, message = "Un message fait au plus 2000 caractères")
    String contenu
) {}
