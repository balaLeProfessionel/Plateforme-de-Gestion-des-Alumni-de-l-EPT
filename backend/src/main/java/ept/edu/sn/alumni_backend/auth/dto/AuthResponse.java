package ept.edu.sn.alumni_backend.auth.dto;

import java.util.List;
import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UUID id,
    String email,
    String nom,
    String prenom,
    String role,
    String statutCompte,
    boolean doitChangerMotDePasse,
    String urlPhoto,
    String message,
    /** Permissions d'administration (vide pour un membre) : le frontend affiche les rubriques permises. */
    List<String> permissions
) { }
