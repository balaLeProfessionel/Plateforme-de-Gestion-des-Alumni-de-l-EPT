package ept.edu.sn.alumni_backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ReinitialiserMotDePasseRequest(
    @Email(message = "Le format de l'email n'est pas valide")
    @NotBlank(message = "L'email est obligatoire")
    String email,

    @Pattern(regexp = "\\d{6}", message = "Le code doit contenir 6 chiffres")
    String code,

    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    String nouveauMotDePasse
) {}
