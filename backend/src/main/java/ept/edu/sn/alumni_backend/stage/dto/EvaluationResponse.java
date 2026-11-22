package ept.edu.sn.alumni_backend.stage.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import ept.edu.sn.alumni_backend.stage.AppreciationGenerale;
import ept.edu.sn.alumni_backend.stage.CritereEvaluation;
import ept.edu.sn.alumni_backend.stage.NiveauCritere;

/**
 * Fiche d'évaluation d'un stage. modifiable dit si le lecteur peut encore la saisir (organisme ou administrateur
 * Stages, convention complète, pas encore soumise).
 */
public record EvaluationResponse(
    SuiviStageResponse stage,
    List<Critere> grille,
    Map<CritereEvaluation, NiveauCritere> criteres,
    BigDecimal dureeEffectiveMois,
    String pointsForts,
    String axesAmelioration,
    String observations,
    AppreciationGenerale appreciationGenerale,
    Boolean avisTuteurValide,
    String etat,
    boolean saisieParEcole,
    Instant soumiseLe,
    Boolean stageValide,
    Instant decideLe,
    boolean modifiable
) {
    public record Critere(CritereEvaluation code, CritereEvaluation.Section section, String libelle) {
    }
}
