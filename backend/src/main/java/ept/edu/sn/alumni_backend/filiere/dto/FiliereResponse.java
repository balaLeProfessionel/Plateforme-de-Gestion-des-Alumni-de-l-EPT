package ept.edu.sn.alumni_backend.filiere.dto;

import java.util.UUID;

/** Filière proposée dans les listes (inscription, création de compte, filtres). */
public record FiliereResponse(UUID id, String nom) {
}
