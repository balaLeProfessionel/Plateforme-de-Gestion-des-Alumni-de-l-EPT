package ept.edu.sn.alumni_backend.cv.extraction;

/** Réponse de l'IA, avec de quoi suivre la provenance et le coût. */
public record ResultatExtraction(
    ProfilExtrait profil,
    String fournisseur,
    String modele,
    Integer jetonsEntree,
    Integer jetonsSortie
) {}
