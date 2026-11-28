package ept.edu.sn.alumni_backend.auth.google;

/** Ce que Google garantit sur la personne, lu dans un jeton d'identité déjà vérifié. */
public record IdentiteGoogle(String email, boolean emailVerifie, String prenom, String nom) {}
