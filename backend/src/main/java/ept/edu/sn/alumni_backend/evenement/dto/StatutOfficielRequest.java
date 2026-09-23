package ept.edu.sn.alumni_backend.evenement.dto;

import jakarta.validation.constraints.NotNull;

public record StatutOfficielRequest(@NotNull Boolean officielEpt) {}
