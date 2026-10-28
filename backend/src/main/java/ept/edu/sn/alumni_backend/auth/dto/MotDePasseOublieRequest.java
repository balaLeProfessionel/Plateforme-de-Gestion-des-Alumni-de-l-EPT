package ept.edu.sn.alumni_backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MotDePasseOublieRequest(
    @Email(message = "Le format de l'email n'est pas valide")
    @NotBlank(message = "L'email est obligatoire")
    String email
) {}
