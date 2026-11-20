package ept.edu.sn.alumni_backend.article;

/**
 * Cycle de vie d'un article, sans relecture : brouillon → publié → supprimé.
 * Le masquage par la modération passe par la publication porteuse (statut {@code MASQUE}).
 */
public enum StatutArticle {
    BROUILLON, PUBLIE, SUPPRIME;

    public boolean peutPasserA(StatutArticle cible) {
        return switch (this) {
            case BROUILLON -> cible == PUBLIE || cible == SUPPRIME;
            case PUBLIE -> cible == SUPPRIME;
            case SUPPRIME -> false;
        };
    }
}
