package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

/** Signature d'une partie, à la date donnée ; date vide = signature retirée (saisie erronée). */
public record SignatureRequest(@NotNull Partie partie, LocalDate date) {
    public enum Partie { ETUDIANT, ORGANISME, ECOLE }
}
