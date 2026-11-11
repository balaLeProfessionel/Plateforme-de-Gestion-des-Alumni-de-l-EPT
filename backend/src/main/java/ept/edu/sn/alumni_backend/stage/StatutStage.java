package ept.edu.sn.alumni_backend.stage;

/**
 * Cycle de vie d'un stage. Une ligne de liste définitive en brouillon, puis un stage confirmé, sont le même objet à
 * deux moments (STA-04). Les statuts des stages déclarés (STA-10) et de la validation finale viendront ensuite.
 */
public enum StatutStage {
    /** Ligne de la liste définitive en brouillon : invisible pour l'organisme et l'étudiant. */
    EN_PREPARATION,
    /** Liste publiée, ou ajout après publication. */
    CONFIRME,
    /** Retiré de la liste après publication, avec un motif. */
    ANNULE
}
