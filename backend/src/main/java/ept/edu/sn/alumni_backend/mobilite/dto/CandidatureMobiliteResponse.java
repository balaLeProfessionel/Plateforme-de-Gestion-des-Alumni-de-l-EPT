package ept.edu.sn.alumni_backend.mobilite.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Une candidature vue par son auteur : l'offre en bref, le statut et les pièces déposées. */
public record CandidatureMobiliteResponse(
    UUID id,
    Offre offre,
    String statut,
    Integer rangAttente,
    Instant soumiseLe,
    Instant retireeLe,
    List<Piece> pieces,
    /** Le candidat peut encore retirer ou renvoyer son dossier : candidature soumise ou retirée, offre ouverte. */
    boolean modifiable
) {
    public record Offre(UUID id, String titre, String organisme, String type, String periode, Integer dureeSemaines,
            String anneeUniversitaire, LocalDate dateLimite, boolean candidaturesOuvertes, String statut, List<String> piecesDemandees) {
    }

    public record Piece(UUID id, String type, String nom, long taille) {
    }
}
