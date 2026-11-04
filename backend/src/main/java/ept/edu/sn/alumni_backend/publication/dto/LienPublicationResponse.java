package ept.edu.sn.alumni_backend.publication.dto;

/** Lien partagé dans une publication, avec l'aperçu lu au moment de publier ; seuls l'adresse et le site sont sûrs. */
public record LienPublicationResponse(String url, String titre, String description, String site) {}
