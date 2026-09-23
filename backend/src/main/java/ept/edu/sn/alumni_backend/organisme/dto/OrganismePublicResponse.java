package ept.edu.sn.alumni_backend.organisme.dto;

import java.time.LocalDate;
import java.util.UUID;

public record OrganismePublicResponse(
    UUID id,
    String nom,
    String description,
    String secteurActivite,
    String typeOrganisme,
    String adresse,
    String pays,
    String siteWeb,
    String logoUrl,
    String statutJuridique,
    String trancheEffectif,
    LocalDate dateCreation,
    String statutCompte
) {}
