package ept.edu.sn.alumni_backend.publication.dto;

import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PublicationRequest(
    @NotNull TypePublication type,
    @Size(max = 160) String titre,
    @NotBlank @Size(max = 5000) String contenu,
    @NotNull AudiencePublication audience,
    @Size(max = 250) String texteAlternatif
) {}
