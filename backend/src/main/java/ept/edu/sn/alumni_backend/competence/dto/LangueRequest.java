package ept.edu.sn.alumni_backend.competence.dto;

import ept.edu.sn.alumni_backend.competence.NiveauLangue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record LangueRequest(
    @NotNull(message = "La langue est obligatoire")
    @Pattern(regexp = "^[a-z]{2,3}$", message = "Code de langue invalide")
    String code,
    @NotNull(message = "Le niveau est obligatoire")
    NiveauLangue niveau
) {}
