package ept.edu.sn.alumni_backend.stage.dto;

/** Validation finale du stage par l'administrateur Stages ; null annule la décision. */
public record DecisionStageRequest(Boolean valide) {
}
