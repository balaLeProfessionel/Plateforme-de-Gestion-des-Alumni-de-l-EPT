package ept.edu.sn.alumni_backend.admin;

/** Actions de l'administration consignées dans le journal (qui, quand, pourquoi). */
public enum TypeActionAdmin {
    VALIDATION_INSCRIPTION,
    REFUS_INSCRIPTION,
    SUSPENSION,
    REACTIVATION,
    CREATION_COMPTE,
    CHANGEMENT_ROLE,
    DIPLOMATION,
    /** Un administrateur corrige son propre nom : le journal garde l'ancien, puisqu'il affiche le nom actuel de l'auteur. */
    MODIFICATION_IDENTITE,
    /** Responsabilités d'un administrateur cochées par un super administrateur (TRA-13) : « avant → après ». */
    MODIFICATION_RESPONSABILITES
}
