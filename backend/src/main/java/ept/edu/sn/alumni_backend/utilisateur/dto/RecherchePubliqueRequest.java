package ept.edu.sn.alumni_backend.utilisateur.dto;

import jakarta.validation.constraints.NotNull;

public record RecherchePubliqueRequest(@NotNull Boolean visible) {}
