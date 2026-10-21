package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.Instant;
import java.util.UUID;

public record EvaluationMentoratResponse(
    UUID id,
    UUID auteurId,
    int note,
    String commentaire,
    Instant creeLe
) {
}
