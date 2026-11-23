package ept.edu.sn.alumni_backend.stage.dto;

import java.util.UUID;

/**
 * Organisme dans le suivi des stages (vue de l'administrateur Stages) : stagiaires accueillis et ce qui reste à faire.
 * organismeId vide : organisme seulement proposé par un étudiant dans une déclaration, désigné par son nom.
 */
public record OrganismeSuiviResponse(
    UUID organismeId,
    String nom,
    String logoUrl,
    long stagiaires,
    long sansEncadrant,
    long conventionsIncompletes,
    /** Convention complète, évaluation pas encore remise. */
    long evaluationsARemettre,
    /** Rapport attendu ou en retard. */
    long rapportsAttendus
) {
}
