package ept.edu.sn.alumni_backend.emploi.dto;

import ept.edu.sn.alumni_backend.emploi.StatutCandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.entity.CandidatureEmploi;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Requêtes du recruteur sur une candidature (#223). */
public final class TraitementCandidatureRequests {
    private TraitementCandidatureRequests() {
    }

    public record ChangementStatut(@NotNull(message = "Choisissez un statut.") StatutCandidatureEmploi statut) {
    }

    public record Note(
        @Size(max = CandidatureEmploi.LONGUEUR_NOTE, message = "La note ne doit pas dépasser " + CandidatureEmploi.LONGUEUR_NOTE + " caractères.")
        String note) {
    }
}
