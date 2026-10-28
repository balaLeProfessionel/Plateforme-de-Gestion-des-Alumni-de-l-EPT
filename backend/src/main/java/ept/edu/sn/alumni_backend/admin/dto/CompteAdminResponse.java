package ept.edu.sn.alumni_backend.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/** Fiche d'un compte vue par l'administration (coordonnées comprises). */
public record CompteAdminResponse(
    UUID id,
    String prenom,
    String nom,
    String email,
    String telephone,
    String role,
    String statutCompte,
    String filiere,
    Integer anneeEntree,
    Integer anneeSortie,
    String nomOrganisme,
    /** Fiche publique de l'organisme, pour vérifier une inscription d'organisme. */
    UUID organismeId,
    String urlPhoto,
    LocalDateTime dateCreation,
    /** Motif de la dernière suspension ou du refus, pour un compte suspendu. */
    String motifSuspension,
    /** Décisions déjà consignées dans le journal pour ce compte. */
    long nombreDecisions
) {
}
