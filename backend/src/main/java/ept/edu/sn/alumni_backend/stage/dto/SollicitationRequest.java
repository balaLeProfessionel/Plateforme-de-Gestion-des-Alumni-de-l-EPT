package ept.edu.sn.alumni_backend.stage.dto;

import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.stage.TypeSollicitation;
import ept.edu.sn.alumni_backend.stage.entity.Sollicitation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Envoi d'une sollicitation : l'administrateur a pu retirer des organismes de la liste proposée. */
public record SollicitationRequest(
    @NotNull TypeSollicitation type,
    @NotBlank @Size(max = Sollicitation.LONGUEUR_OBJET) String objet,
    @NotBlank @Size(max = Sollicitation.LONGUEUR_MESSAGE) String message,
    @NotEmpty(message = "Choisissez au moins un organisme.") @Size(max = 2000) List<@NotNull UUID> organismeIds
) {
}
