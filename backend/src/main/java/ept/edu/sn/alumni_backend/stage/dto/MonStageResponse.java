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
    boolean declare
) {
}
