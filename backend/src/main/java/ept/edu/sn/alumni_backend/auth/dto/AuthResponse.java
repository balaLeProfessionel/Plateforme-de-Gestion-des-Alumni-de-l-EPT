package ept.edu.sn.alumni_backend.auth.dto;

import java.util.UUID;

public record AuthResponse(
    String token,
    UUID id,
    String email,
    String nom,
    String prenom,
    String role,
    String statutCompte,
    String message
) { }