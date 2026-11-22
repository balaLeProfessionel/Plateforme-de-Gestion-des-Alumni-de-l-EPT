package ept.edu.sn.alumni_backend.mobilite.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Les dossiers d'une offre vus par le chef du service mobilité, avec ce qu'il faut pour décider et publier la liste. */
public record CandidaturesOffreResponse(
    Offre offre,
    List<Dossier> dossiers,
    long retenues,
    long enAttente,
    long sansDecision,
    /** Pourquoi la liste ne peut pas être publiée, ou null si elle le peut (ou l'est déjà). */
    String blocagePublication
) {
    public record Offre(UUID id, String titre, String organisme, String statut, int nombrePlaces, LocalDate dateLimite,
            String anneeUniversitaire, String periode, Integer dureeSemaines,
            /** Les décisions se prennent après la date limite (ou la clôture), jusqu'à la publication de la liste. */
            boolean decisionsOuvertes, Instant listePublieeLe) {
    }

    public record Dossier(UUID id, Candidat candidat, String statut, Integer rangAttente, Instant soumiseLe, List<Piece> pieces,
            /** Autre offre de la même année où ce candidat est déjà retenu, pour l'avertissement de doublon. */
            String retenuAilleurs) {
    }

    public record Candidat(UUID id, String prenom, String nom, String role, String filiere, String classe) {
    }

    public record Piece(UUID id, String type, String nom, long taille) {
    }
}
