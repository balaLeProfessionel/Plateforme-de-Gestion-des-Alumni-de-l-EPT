package ept.edu.sn.alumni_backend.annuaire.dto;

/** Ce qu'une personne sans compte peut voir d'un diplômé : ni identifiant, ni photo, ni coordonnées. */
public record DiplomePublicResponse(
    String prenom,
    String nom,
    Integer promotion,
    String filiere
) {}
