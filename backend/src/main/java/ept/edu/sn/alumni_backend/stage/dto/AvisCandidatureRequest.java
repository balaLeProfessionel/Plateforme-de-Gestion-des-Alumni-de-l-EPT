package ept.edu.sn.alumni_backend.stage.dto;

import ept.edu.sn.alumni_backend.stage.AvisOrganisme;
import jakarta.validation.constraints.NotNull;

public record AvisCandidatureRequest(@NotNull(message = "Choisissez un avis.") AvisOrganisme avis) {
}
