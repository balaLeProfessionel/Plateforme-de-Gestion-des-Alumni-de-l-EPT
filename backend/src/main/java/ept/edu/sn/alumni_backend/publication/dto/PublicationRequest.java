package ept.edu.sn.alumni_backend.publication.dto;

import java.time.LocalDate;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Nouvelle publication ; {@code dateLimite} n'est attendue que pour un appel à projet. */
public record PublicationRequest(
    @NotNull TypePublication type,
    @Size(max = 160) String titre,
    @NotBlank @Size(max = 5000) String contenu,
    @NotNull AudiencePublication audience,
    @Size(max = 250) String texteAlternatif,
    LocalDate dateLimite
) {}
