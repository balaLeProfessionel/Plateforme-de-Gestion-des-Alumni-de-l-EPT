package ept.edu.sn.alumni_backend.partenariat;

/** Opérations consignées dans l'historique d'un accord. */
public enum ActionAccord {
    PROPOSITION,
    MODIFICATION,
    RETRAIT,
    ACCEPTATION,
    REFUS,
    DEBUT,
    FIN,
    /** Résiliation signalée : elle prend effet à la fin du préavis. */
    RESILIATION,
    RESILIATION_EFFECTIVE,
    AJOUT_PIECE,
    RETRAIT_PIECE
}
