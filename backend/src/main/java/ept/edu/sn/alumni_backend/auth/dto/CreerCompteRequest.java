package ept.edu.sn.alumni_backend.auth.dto;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreerCompteRequest(
    @NotBlank String nom,
    @NotBlank String prenom,
    @Email @NotBlank String email,
    @NotNull TypeRole role,
    Integer anneeEntree,
    String filiere
) {}