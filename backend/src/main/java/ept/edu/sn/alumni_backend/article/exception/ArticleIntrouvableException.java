package ept.edu.sn.alumni_backend.article.exception;

/** Article absent, supprimé, brouillon d'un autre membre ou hors de l'audience du lecteur. */
public class ArticleIntrouvableException extends RuntimeException {
    public ArticleIntrouvableException() {
        super("Cet article n'est pas disponible.");
    }
}
