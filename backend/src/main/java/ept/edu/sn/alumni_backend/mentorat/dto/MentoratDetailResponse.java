package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.List;

public record MentoratDetailResponse(
    MentoratResponse mentorat,
    List<SeanceMentoratResponse> seances,
    List<EvaluationMentoratResponse> evaluations,
    boolean peutEvaluer
) {
}
