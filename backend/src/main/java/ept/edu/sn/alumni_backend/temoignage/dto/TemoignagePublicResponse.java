package ept.edu.sn.alumni_backend.temoignage.dto;

public record TemoignagePublicResponse(
    String nom,
    String promotion,
    String fonction,
    String organisation,
    String pays,
    String texte,
    String urlPhoto
) {}
