package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

/** Ajout d'un étudiant à la liste définitive ; sans dates, celles de l'offre sont reprises si elle en a. */
public record AjoutListeRequest(@NotNull UUID etudiantId, LocalDate dateDebut, LocalDate dateFin) {
}
