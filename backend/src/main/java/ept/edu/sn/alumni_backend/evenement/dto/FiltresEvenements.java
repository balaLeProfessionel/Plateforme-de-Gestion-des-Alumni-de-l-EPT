package ept.edu.sn.alumni_backend.evenement.dto;

import java.util.UUID;

/**
 * Critères facultatifs de la liste des événements : texte (titre ou description), lieu,
 * événements officiels de l'EPT ou de la communauté, et événements organisés par un organisme
 * (fiche de l'organisme).
 */
public record FiltresEvenements(String recherche, String lieu, Boolean officiel, UUID organisme) {
    public FiltresEvenements(String recherche, String lieu, Boolean officiel) {
        this(recherche, lieu, officiel, null);
    }

    public FiltresEvenements {
        recherche = texteOuNull(recherche);
        lieu = texteOuNull(lieu);
    }

    private static String texteOuNull(String texte) {
        return texte == null || texte.isBlank() ? null : texte.strip();
    }
}
