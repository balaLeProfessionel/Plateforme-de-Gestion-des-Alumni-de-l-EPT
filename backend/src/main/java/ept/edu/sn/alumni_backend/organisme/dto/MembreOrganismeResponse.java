package ept.edu.sn.alumni_backend.organisme.dto;

import java.util.UUID;

/**
 * Membre passé par un organisme, tel que l'affiche sa fiche : poste le plus représentatif
 * (en cours, sinon le plus récent) et années de présence. Rien de privé (ni e-mail ni téléphone).
 */
public record MembreOrganismeResponse(
    UUID id,
    String prenom,
    String nom,
    String urlPhoto,
    String role,
    String poste,
    boolean actuel,
    Integer anneeDebut,
    Integer anneeFin
) {
}
