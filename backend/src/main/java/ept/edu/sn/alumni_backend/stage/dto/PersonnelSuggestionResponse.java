package ept.edu.sn.alumni_backend.stage.dto;

import java.util.UUID;

/** Membre du personnel proposé comme encadrant interne. */
public record PersonnelSuggestionResponse(UUID id, String prenom, String nom, String email, String urlPhoto) {
}
