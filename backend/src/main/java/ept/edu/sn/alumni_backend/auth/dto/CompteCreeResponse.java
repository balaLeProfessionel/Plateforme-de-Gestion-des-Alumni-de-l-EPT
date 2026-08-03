package ept.edu.sn.alumni_backend.auth.dto;

import java.util.UUID;

public record CompteCreeResponse(
    UUID id,
    String email,
    String nom,
    String prenom,
    String role,
    String motDePasseTemporaire
) {}