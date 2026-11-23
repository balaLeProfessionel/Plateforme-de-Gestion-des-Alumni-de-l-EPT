package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Convention saisie par le service des Relations extérieures : déjà signée (ACTIVE, dates obligatoires) ou en cours de
 * négociation (EN_NEGOCIATION).
 */
public record SaisieConventionRequest(
    @NotNull(message = "Choisissez l'organisme") UUID organismeId,
    @NotBlank(message = "L'objet est obligatoire") @Size(max = 200) String objet,
    @Size(max = 1000) String domaines,
    @NotNull(message = "Le statut est obligatoire") StatutConvention statut,
    LocalDate dateSignature,
    LocalDate dateDebut,
    LocalDate dateFin
) {
}
