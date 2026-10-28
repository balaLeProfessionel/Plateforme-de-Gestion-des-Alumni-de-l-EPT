package ept.edu.sn.alumni_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangerMotDePasseInitialRequest(
    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    String nouveauMotDePasse,

    @NotBlank(message = "Le refresh token est obligatoire")
    String refreshToken
) {}
