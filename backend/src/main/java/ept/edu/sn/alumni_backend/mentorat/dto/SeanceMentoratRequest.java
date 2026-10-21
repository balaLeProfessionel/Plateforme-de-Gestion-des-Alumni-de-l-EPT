package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.Instant;

import ept.edu.sn.alumni_backend.mentorat.ModaliteSeance;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SeanceMentoratRequest(
    @NotNull Instant debut,
    @Min(15) @Max(240) int dureeMinutes,
    @NotNull ModaliteSeance modalite,
    @Size(max = 500) String lieuOuLien
) {
}
