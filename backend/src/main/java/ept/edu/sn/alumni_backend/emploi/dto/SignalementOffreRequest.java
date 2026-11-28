package ept.edu.sn.alumni_backend.emploi.dto;

import ept.edu.sn.alumni_backend.emploi.MotifSignalementOffre;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SignalementOffreRequest(
    @NotNull(message = "Le motif est obligatoire.") MotifSignalementOffre motif,
    @Size(max = 500, message = "500 caractères au maximum.") String commentaire
) {
}
