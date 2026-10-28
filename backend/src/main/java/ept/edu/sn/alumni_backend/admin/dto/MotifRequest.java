package ept.edu.sn.alumni_backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Motif obligatoire d'un refus ou d'une suspension : il est communiqué au titulaire du compte. */
public record MotifRequest(
    @NotBlank(message = "Le motif est obligatoire") @Size(max = 500) String motif
) {
}
