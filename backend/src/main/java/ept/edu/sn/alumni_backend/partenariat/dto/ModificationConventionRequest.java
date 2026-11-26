package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Correction d'une convention par le service des Relations extérieures ; les dates ne valent que pour une convention active. */
public record ModificationConventionRequest(
    @NotBlank(message = "L'objet est obligatoire") @Size(max = 200) String objet,
    @Size(max = 1000) String domaines,
    LocalDate dateSignature,
    LocalDate dateDebut,
    LocalDate dateFin
) {
}
