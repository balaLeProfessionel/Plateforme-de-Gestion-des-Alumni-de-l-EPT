package ept.edu.sn.alumni_backend.cv.extraction;

/**
 * Contrat du domaine : « le contenu d'un CV donne un profil structuré ». Le reste de l'application ignore
 * quel fournisseur d'IA répond ; il se choisit par configuration (voir {@link ExtracteurCvConfig}).
 */
public interface ExtracteurCv {

    /** false si aucun fournisseur n'est configuré : l'écran propose alors seulement la saisie manuelle. */
    boolean disponible();

    /** Le modèle configuré lit-il les images (photos, captures, PDF scannés) ? */
    boolean imagesAcceptees();

    /** Nom montré au membre dans le consentement, par exemple « Anthropic (Claude) ». */
    String nomFournisseur();

    /** Appel bloquant (plusieurs secondes) : à lancer hors du fil de la requête HTTP. */
    ResultatExtraction extraire(ContenuCv contenu);
}
