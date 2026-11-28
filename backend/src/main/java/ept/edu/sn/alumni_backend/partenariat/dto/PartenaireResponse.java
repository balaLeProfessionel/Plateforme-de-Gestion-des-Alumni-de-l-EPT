package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Un organisme partenaire de l'EPT tel que les membres le voient : informations institutionnelles et nature des accords
 * en vigueur. Ni échéance, ni motif, ni document : ils restent entre l'organisme et l'école.
 */
public record PartenaireResponse(
    UUID id,
    String nom,
    String logoUrl,
    String typeOrganisme,
    String secteurActivite,
    String pays,
    String siteWeb,
    LocalDate partenaireDepuis,
    boolean accordsStage,
    boolean accordsMobilite
) {
}
