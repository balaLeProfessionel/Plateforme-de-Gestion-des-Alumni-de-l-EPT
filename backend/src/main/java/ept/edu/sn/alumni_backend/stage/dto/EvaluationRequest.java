package ept.edu.sn.alumni_backend.stage.dto;

import java.math.BigDecimal;
import java.util.Map;

import ept.edu.sn.alumni_backend.stage.AppreciationGenerale;
import ept.edu.sn.alumni_backend.stage.CritereEvaluation;
import ept.edu.sn.alumni_backend.stage.NiveauCritere;
import ept.edu.sn.alumni_backend.stage.entity.EvaluationStage;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

/** Saisie de la fiche d'évaluation ; tout est facultatif pour un brouillon, tout est exigé à la soumission. */
public record EvaluationRequest(
    Map<CritereEvaluation, NiveauCritere> criteres,
    @DecimalMin("0.5") @DecimalMax("24") @Digits(integer = 2, fraction = 1) BigDecimal dureeEffectiveMois,
    @Size(max = EvaluationStage.LONGUEUR_TEXTE) String pointsForts,
    @Size(max = EvaluationStage.LONGUEUR_TEXTE) String axesAmelioration,
    @Size(max = EvaluationStage.LONGUEUR_TEXTE) String observations,
    AppreciationGenerale appreciationGenerale,
    Boolean avisTuteurValide
) {
}
