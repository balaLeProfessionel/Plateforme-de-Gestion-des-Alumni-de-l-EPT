package ept.edu.sn.alumni_backend.publication.dto;

import ept.edu.sn.alumni_backend.publication.MotifSignalement;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Motif obligatoire ; la précision l'est aussi quand le motif est « Autre » (vérifié par le service). */
public record SignalementRequest(@NotNull MotifSignalement motif, @Size(max = 500) String detail) {}
