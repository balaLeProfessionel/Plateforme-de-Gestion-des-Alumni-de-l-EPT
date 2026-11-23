package ept.edu.sn.alumni_backend.stage.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Coordonnées du maître de stage côté organisme. */
public record TuteurRequest(
    @NotBlank(message = "Le nom du maître de stage est obligatoire") @Size(max = 150) String nom,
    @Size(max = 150) String fonction,
    @Email(message = "Adresse e-mail du maître de stage invalide") @Size(max = 150) String email,
    @Size(max = 30) String telephone
) {
}
