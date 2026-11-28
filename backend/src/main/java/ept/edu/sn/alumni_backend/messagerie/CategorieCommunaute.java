package ept.edu.sn.alumni_backend.messagerie;

/**
 * Nature d'une communauté (un groupe ouvert à tout un public). Les trois premières sont automatiques : on en fait
 * partie par son profil (année de sortie, filière) et on ne peut pas les quitter. Les autres se rejoignent.
 */
public enum CategorieCommunaute {
    PROMO,
    FILIERE,
    PROMO_FILIERE,
    VILLE,
    SECTEUR,
    INTERET;

    public boolean automatique() {
        return this == PROMO || this == FILIERE || this == PROMO_FILIERE;
    }
}
