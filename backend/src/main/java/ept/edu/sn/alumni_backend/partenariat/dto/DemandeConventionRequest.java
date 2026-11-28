package ept.edu.sn.alumni_backend.partenariat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Demande de convention-cadre déposée par un organisme, modifiable tant que l'école ne l'a pas prise en charge. */
public record DemandeConventionRequest(
    @NotBlank(message = "L'objet est obligatoire") @Size(max = 200) String objet,
    @Size(max = 1000) String domaines,
    @NotBlank(message = "Présentez votre demande") @Size(max = 3000) String message
) {
}
