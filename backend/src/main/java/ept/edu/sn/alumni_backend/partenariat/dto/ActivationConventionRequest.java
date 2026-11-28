package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

/** Signature de la convention : elle devient active entre ces deux dates. */
public record ActivationConventionRequest(
    @NotNull(message = "La date de signature est obligatoire") LocalDate dateSignature,
    @NotNull(message = "La date de début est obligatoire") LocalDate dateDebut,
    @NotNull(message = "La date de fin est obligatoire") LocalDate dateFin
) {
}
