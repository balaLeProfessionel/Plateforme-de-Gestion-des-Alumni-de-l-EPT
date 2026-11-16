package ept.edu.sn.alumni_backend.messagerie;

/**
 * Puis-je écrire dans cette conversation ? Seule une conversation directe peut être fermée, par un blocage.
 * {@link #FERMEE} ne dit pas à la personne bloquée qu'elle l'est.
 */
public enum EtatEcriture {
    OUVERTE,
    /** J'ai bloqué l'autre personne : je peux la débloquer. */
    J_AI_BLOQUE,
    /** L'autre personne m'a bloqué. */
    FERMEE
}
