package ept.edu.sn.alumni_backend.stage;

/**
 * Cycle de vie d'un stage. Une ligne de liste définitive en brouillon, puis un stage confirmé, sont le même objet à
 * deux moments (STA-04). Un stage trouvé par l'étudiant est déclaré, puis validé (confirmé) ou refusé (STA-10).
 */
public enum StatutStage {
    /** Ligne de la liste définitive en brouillon : invisible pour l'organisme et l'étudiant. */
    EN_PREPARATION,
    /** Liste publiée, ou ajout après publication. */
    CONFIRME,
    /** Retiré de la liste après publication, avec un motif. */
    ANNULE,
    /** Trouvé par l'étudiant hors offre, en attente de l'administrateur Stages (STA-10). */
    DECLARE,
    /** Déclaration refusée par l'administrateur Stages, avec un motif. */
    REFUSE
}
