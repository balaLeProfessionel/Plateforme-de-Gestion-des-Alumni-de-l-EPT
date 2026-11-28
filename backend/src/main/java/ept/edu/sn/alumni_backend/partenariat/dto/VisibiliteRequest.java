package ept.edu.sn.alumni_backend.partenariat.dto;

import jakarta.validation.constraints.NotNull;

/** Montrer ou masquer un organisme dans la liste des partenaires vue par les membres. */
public record VisibiliteRequest(@NotNull(message = "Indiquez si l'organisme est visible") Boolean visible) {
}
