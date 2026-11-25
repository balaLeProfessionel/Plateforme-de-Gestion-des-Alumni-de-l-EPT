package ept.edu.sn.alumni_backend.cv;

/**
 * Vie d'un import : EN_COURS → PRET (brouillon à relire) ou ECHEC ;
 * PRET → VALIDE (le membre a enregistré son profil) ou ABANDONNE (abandon ou brouillon expiré).
 * Les données extraites sont effacées dès que l'import quitte PRET.
 */
public enum StatutImportCv {
    EN_COURS,
    PRET,
    ECHEC,
    VALIDE,
    ABANDONNE
}
