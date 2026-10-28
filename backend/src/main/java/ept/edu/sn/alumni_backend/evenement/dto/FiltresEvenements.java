package ept.edu.sn.alumni_backend.evenement.dto;

/**
 * Critères facultatifs de la liste des événements : texte (titre ou description), lieu,
 * et événements officiels de l'EPT ou de la communauté.
 */
public record FiltresEvenements(String recherche, String lieu, Boolean officiel) {
    public FiltresEvenements {
        recherche = texteOuNull(recherche);
        lieu = texteOuNull(lieu);
    }

    private static String texteOuNull(String texte) {
        return texte == null || texte.isBlank() ? null : texte.strip();
    }
}
