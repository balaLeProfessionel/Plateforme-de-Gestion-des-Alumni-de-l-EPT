package ept.edu.sn.alumni_backend.filiere.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

/** La filière à fusionner disparaît : ses comptes passent dans la filière cible. */
public record FusionFiliereRequest(@NotNull(message = "Choisissez la filière qui reçoit les comptes.") UUID cibleId) {
}
