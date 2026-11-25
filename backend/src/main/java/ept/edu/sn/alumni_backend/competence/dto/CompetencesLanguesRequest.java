package ept.edu.sn.alumni_backend.competence.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Remplace en une fois les compétences et les langues du membre ; l'ordre des compétences est conservé. */
public record CompetencesLanguesRequest(
    @NotNull
    @Size(max = 30, message = "30 compétences au maximum")
    List<@NotBlank(message = "Une compétence ne peut pas être vide")
         @Size(max = 80, message = "Une compétence ne peut pas dépasser 80 caractères") String> competences,
    @NotNull
    @Size(max = 15, message = "15 langues au maximum")
    List<@Valid @NotNull LangueRequest> langues
) {}
