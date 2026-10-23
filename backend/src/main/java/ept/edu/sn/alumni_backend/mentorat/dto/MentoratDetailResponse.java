package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.List;

public record MentoratDetailResponse(
    MentoratResponse mentorat,
    List<SeanceMentoratResponse> seances,
    List<EvaluationMentoratResponse> evaluations,
    /** Étapes du programme et leur avancement ; vide pour un mentorat libre. */
    List<EtapeSuivieResponse> etapes,
    boolean peutEvaluer
) {
}
