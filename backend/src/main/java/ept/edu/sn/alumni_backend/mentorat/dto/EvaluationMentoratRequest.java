package ept.edu.sn.alumni_backend.mentorat.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record EvaluationMentoratRequest(
    @Min(1) @Max(5) int note,
    @Size(max = 1000) String commentaire
) {
}
