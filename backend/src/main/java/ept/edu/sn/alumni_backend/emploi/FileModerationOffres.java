package ept.edu.sn.alumni_backend.emploi;

/** Files de modération des offres d'emploi (#224). */
public enum FileModerationOffres {
    /** Offres gérées d'organismes non validés, en attente : les plus anciennes d'abord. */
    A_VERIFIER,
    /** Offres publiées visées par au moins un signalement en attente. */
    SIGNALEES,
    /** Toutes les offres publiées, à retirer si besoin. */
    PUBLIEES
}
