package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;
import java.util.UUID;

/** Étudiant confirmé sur une offre, vu par l'organisme après publication de la liste (sans son adresse e-mail). */
public record StagiaireResponse(UUID id, CandidatureRecueResponse.Etudiant etudiant, LocalDate dateDebut, LocalDate dateFin) {
}
