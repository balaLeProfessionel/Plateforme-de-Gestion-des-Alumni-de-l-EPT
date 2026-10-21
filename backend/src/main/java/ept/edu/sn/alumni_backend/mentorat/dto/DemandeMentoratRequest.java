package ept.edu.sn.alumni_backend.mentorat.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DemandeMentoratRequest(
    @NotNull UUID profilMentorId,
    @NotNull UUID domaineId,
    @NotBlank @Size(max = 1000) String objectif
) {
}
