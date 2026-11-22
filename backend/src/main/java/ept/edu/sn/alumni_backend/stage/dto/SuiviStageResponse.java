package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Stage confirmé, vu dans le suivi (STA-08) : par l'administrateur Stages, l'encadrant interne, le chef de département
 * de la filière ou l'organisme d'accueil. L'e-mail de l'étudiant est donné à tous, organisme compris, pour le contacter.
 */
public record SuiviStageResponse(
    UUID id,
    UUID offreId,
    CandidatureRecueResponse.Etudiant etudiant,
    String email,
    UUID organismeId,
    String organisme,
    String typeStage,
    String sujet,
    String lieu,
    LocalDate dateDebut,
    LocalDate dateFin,
    /** A_VENIR, EN_COURS ou TERMINE, déduit des dates (pas de tâche planifiée). */
    String deroulement,
    Encadrant encadrant,
    String tuteurNom,
    String tuteurFonction,
    String tuteurEmail,
    String tuteurTelephone,
    boolean declare,
    /** AUCUNE, EN_COURS ou COMPLETE (STA-05). */
    String convention,
    /** AUCUNE, BROUILLON ou SOUMISE (STA-06). */
    String evaluation,
    /** Validation finale par l'administrateur Stages ; vide tant qu'il n'a pas décidé. */
    Boolean stageValide,
    RapportResponse rapport
) {
    public record Encadrant(UUID id, String prenom, String nom, String email) {
    }
}
