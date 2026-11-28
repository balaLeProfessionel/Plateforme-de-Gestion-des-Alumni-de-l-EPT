package ept.edu.sn.alumni_backend.auth.dto;

/**
 * Liaison Google du compte connecté. {@code motDePasseDefini} faux : le mot de passe est aléatoire
 * (compte créé ou repris avec Google), délier n'est donc pas possible avant d'en définir un.
 */
public record LiaisonGoogleResponse(boolean lie, String emailGoogle, boolean motDePasseDefini) {}
