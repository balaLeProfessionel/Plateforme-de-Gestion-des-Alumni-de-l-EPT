package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Candidature reçue, vue par l'organisme de l'offre ou l'administrateur Stages. L'adresse e-mail de l'étudiant n'est
 * donnée qu'à l'école ; l'organisme a ses coordonnées par le CV.
 */
public record CandidatureRecueResponse(
    UUID id,
    Etudiant etudiant,
    String email,
    String statut,
    String avisOrganisme,
    String lettreMotivation,
    String nomCv,
    Instant envoyeeLe,
    Instant avisDonneLe
) {
    public record Etudiant(UUID id, String prenom, String nom, String filiere, String classe, Integer anneeEntree, String urlPhoto) {
    }
}
