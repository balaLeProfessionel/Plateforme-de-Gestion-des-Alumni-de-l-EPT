package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Stage de l'étudiant : confirmé (liste définitive ou déclaration validée), ou déclaré en attente / refusé. */
public record MonStageResponse(
    UUID id,
    UUID offreId,
    String sujet,
    String organisme,
    String typeStage,
    String lieu,
    LocalDate dateDebut,
    LocalDate dateFin,
    Instant confirmeLe,
    /** CONFIRME, DECLARE ou REFUSE. */
    String statut,
    /** Motif d'un refus de déclaration. */
    String motif,
    /** Vrai pour un stage trouvé par l'étudiant (STA-10). */
    boolean declare,
    /** Rapport de stage (STA-07), pour un stage confirmé ; vide sinon. */
    RapportResponse rapport,
    /** Encadrant interne désigné par l'école (STA-08) ; vide tant qu'il n'est pas désigné. */
    SuiviStageResponse.Encadrant encadrant,
    /** AUCUNE, EN_COURS ou COMPLETE (STA-05) ; vide si le stage n'est pas confirmé. */
    String convention,
    /** Validation finale par l'école (STA-06) ; l'évaluation elle-même reste cachée à l'étudiant. */
    Boolean stageValide
) {
}
