package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Stage confirmé, vu par l'étudiant qui l'effectue. */
public record MonStageResponse(
    UUID id,
    UUID offreId,
    String sujet,
    String organisme,
    String typeStage,
    String lieu,
    LocalDate dateDebut,
    LocalDate dateFin,
    Instant confirmeLe
) {
}
