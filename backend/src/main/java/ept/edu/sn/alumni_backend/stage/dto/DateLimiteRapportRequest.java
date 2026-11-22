package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Date limite de dépôt du rapport, pour un ou plusieurs stages confirmés. */
public record DateLimiteRapportRequest(@NotEmpty @Size(max = 200) List<@NotNull UUID> stageIds, @NotNull LocalDate dateLimite) {
}
