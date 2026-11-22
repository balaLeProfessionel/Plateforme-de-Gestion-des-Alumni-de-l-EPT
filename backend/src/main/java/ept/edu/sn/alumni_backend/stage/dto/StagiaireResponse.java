package ept.edu.sn.alumni_backend.stage.dto;

import java.time.LocalDate;
import java.util.UUID;

/** Étudiant confirmé sur une offre, vu par l'organisme après publication de la liste (avec son adresse e-mail, pour le contacter). */
public record StagiaireResponse(UUID id, CandidatureRecueResponse.Etudiant etudiant, String email, LocalDate dateDebut, LocalDate dateFin) {
}
