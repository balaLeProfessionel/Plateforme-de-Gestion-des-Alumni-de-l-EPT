package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.Set;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AjoutParticipantsRequest(
    @NotEmpty(message = "Choisissez au moins un membre")
    @Size(max = 50, message = "Ajoutez au plus 50 membres à la fois")
    Set<@NotNull UUID> membreIds
) {}
