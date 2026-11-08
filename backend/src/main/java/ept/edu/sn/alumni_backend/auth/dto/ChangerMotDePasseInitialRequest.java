package ept.edu.sn.alumni_backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Premier mot de passe choisi par le titulaire. Prénom et nom ne servent qu'à un compte d'administration,
 * qui n'a pas de profil où les corriger (le premier administrateur est créé sans nom réel).
 */
public record ChangerMotDePasseInitialRequest(
    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    String nouveauMotDePasse,

    @NotBlank(message = "Le refresh token est obligatoire")
    String refreshToken,

    @Size(max = 100, message = "100 caractères au maximum") String prenom,
    @Size(max = 100, message = "100 caractères au maximum") String nom
) {
    public ChangerMotDePasseInitialRequest(String nouveauMotDePasse, String refreshToken) {
        this(nouveauMotDePasse, refreshToken, null, null);
    }
}
