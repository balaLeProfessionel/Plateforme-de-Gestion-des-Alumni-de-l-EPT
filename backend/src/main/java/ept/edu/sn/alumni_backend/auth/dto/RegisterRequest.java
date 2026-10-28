package ept.edu.sn.alumni_backend.auth.dto;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Le nom est obligatoire")
    String nom,

    @NotBlank(message = "Le prénom est obligatoire")
    String prenom,

    @Email(message = "Format d'email invalide")
    @NotBlank(message = "L'email est obligatoire")
    String email,

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    String password,

    @NotNull(message = "Le rôle est obligatoire")
    TypeRole role,

    String telephone,
    Integer anneeSortie,
    String filiere,
    String nomOrganisme
) { }