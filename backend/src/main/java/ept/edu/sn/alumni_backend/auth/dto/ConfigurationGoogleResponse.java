package ept.edu.sn.alumni_backend.auth.dto;

/** Identifiant client public du bouton Google ; {@code null} quand la connexion Google n'est pas configurée. */
public record ConfigurationGoogleResponse(String clientId) {}
