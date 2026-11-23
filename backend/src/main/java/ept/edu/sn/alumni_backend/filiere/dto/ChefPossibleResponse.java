package ept.edu.sn.alumni_backend.filiere.dto;

import java.util.UUID;

/** Compte du personnel qui peut être désigné chef de département. */
public record ChefPossibleResponse(UUID id, String prenom, String nom, String email) {
}
