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
    MODIFICATION_RESPONSABILITES,
    /** Compte du personnel désigné chef du département d'une filière (TRA-14) ; le détail nomme la filière. */
    DESIGNATION_CHEF_DEPARTEMENT,
    /** Fin de la mission de chef de département : remplacé par un autre ou retiré. */
    RETRAIT_CHEF_DEPARTEMENT,
    /** Classe d'un étudiant modifiée par l'administration (passage en classe supérieure, correction) : « avant → après ». */
    MODIFICATION_CLASSE
}
