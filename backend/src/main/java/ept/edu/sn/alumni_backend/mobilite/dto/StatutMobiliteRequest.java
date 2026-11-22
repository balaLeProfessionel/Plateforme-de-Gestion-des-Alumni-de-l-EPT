package ept.edu.sn.alumni_backend.mobilite.dto;

import ept.edu.sn.alumni_backend.mobilite.StatutMobilite;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Nouveau statut d'une mobilité (EN_COURS, TERMINEE, ANNULEE) ; le motif est exigé pour une annulation. */
public record StatutMobiliteRequest(
    @NotNull(message = "Le statut est obligatoire.") StatutMobilite statut,
    @Size(max = 500, message = "500 caractères au maximum.") String motif
) {
}
