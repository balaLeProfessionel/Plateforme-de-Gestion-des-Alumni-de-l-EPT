package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record OuvertureDirecteRequest(@NotNull(message = "Choisissez la personne à qui écrire") UUID destinataireId) {}
