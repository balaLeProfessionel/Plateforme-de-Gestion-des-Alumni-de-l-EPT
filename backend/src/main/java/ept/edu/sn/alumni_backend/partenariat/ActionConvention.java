package ept.edu.sn.alumni_backend.partenariat;

/** Opérations consignées dans l'historique d'une convention. */
public enum ActionConvention {
    DEMANDE,
    MODIFICATION_DEMANDE,
    ANNULATION,
    SAISIE,
    MODIFICATION,
    EXAMEN,
    NEGOCIATION,
    ACTIVATION,
    REFUS,
    /** Résiliation signalée : elle prend effet à la fin du préavis. */
    RESILIATION,
    ANNULATION_RESILIATION,
    RESILIATION_EFFECTIVE,
    EXPIRATION,
    /** L'organisme est montré ou masqué dans la liste des partenaires vue par les membres. */
    VISIBILITE,
    AJOUT_PIECE,
    RETRAIT_PIECE
}
