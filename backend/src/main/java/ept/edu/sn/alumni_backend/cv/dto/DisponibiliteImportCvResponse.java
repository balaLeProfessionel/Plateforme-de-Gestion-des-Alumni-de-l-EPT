package ept.edu.sn.alumni_backend.cv.dto;

/** Ce que l'écran doit savoir avant le dépôt : import possible ? images acceptées ? qui lira le CV ? */
public record DisponibiliteImportCvResponse(
    boolean disponible,
    boolean imagesAcceptees,
    String fournisseur,
    int fichiersMax,
    long tailleMaxOctets
) {}
