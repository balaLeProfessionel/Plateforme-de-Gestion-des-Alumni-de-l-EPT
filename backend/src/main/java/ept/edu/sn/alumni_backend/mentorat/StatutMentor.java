package ept.edu.sn.alumni_backend.mentorat;

/** Situation d'un alumni mentor, affichée hors du module (annuaire, profil). */
public enum StatutMentor {
    /** Offre disponible avec au moins une place : on peut le solliciter. */
    DISPONIBLE,
    /** Offre en pause ou complète. */
    INDISPONIBLE
}
