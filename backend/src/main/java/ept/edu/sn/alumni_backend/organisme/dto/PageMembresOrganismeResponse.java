package ept.edu.sn.alumni_backend.organisme.dto;

import java.util.List;

/**
 * Une page de membres passés par l'organisme ; {@code actuels} et {@code anciens} comptent chaque groupe
 * (recherche comprise) pour les onglets, {@code totalElements} ne compte que le groupe demandé.
 */
public record PageMembresOrganismeResponse(
    List<MembreOrganismeResponse> contenu,
    int page,
    int taille,
    long totalElements,
    int totalPages,
    long actuels,
    long anciens
) {
}
