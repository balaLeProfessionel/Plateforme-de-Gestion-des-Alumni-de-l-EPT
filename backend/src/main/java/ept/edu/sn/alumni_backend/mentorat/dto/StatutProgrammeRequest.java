package ept.edu.sn.alumni_backend.mentorat.dto;

import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;
import jakarta.validation.constraints.NotNull;

public record StatutProgrammeRequest(@NotNull StatutProgramme statut) {
}
