package ept.edu.sn.alumni_backend.auth.google;

/**
 * Ce que Google garantit sur la personne, lu dans un jeton d'identité déjà vérifié.
 * {@code sub} est l'identifiant permanent du compte Google : il ne change pas quand l'adresse change.
 */
public record IdentiteGoogle(String sub, String email, boolean emailVerifie, String prenom, String nom) {}
