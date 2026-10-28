package ept.edu.sn.alumni_backend.organisme.dto;

import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CompleterOrganismeRequest(
    @NotBlank String description,
    @NotBlank String secteurActivite,
    @NotNull TypeOrganisme typeOrganisme,
    String adresse,
    String siteWeb,
    String logoUrl,
    String statutJuridique,
    String pays
) { }
