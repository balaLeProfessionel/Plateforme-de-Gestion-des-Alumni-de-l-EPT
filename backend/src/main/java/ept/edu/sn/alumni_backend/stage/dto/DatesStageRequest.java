package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record DatesStageRequest(@NotNull LocalDate dateDebut, @NotNull LocalDate dateFin) {
}
