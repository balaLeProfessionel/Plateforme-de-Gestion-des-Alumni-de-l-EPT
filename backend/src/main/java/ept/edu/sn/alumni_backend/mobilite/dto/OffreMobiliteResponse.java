package ept.edu.sn.alumni_backend.mobilite.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Une offre de mobilité. Le motif de retrait n'est rempli que pour l'institut de l'offre et le chef du service
 * mobilité ; l'éligibilité, que pour un étudiant ou un enseignant.
 */
public record OffreMobiliteResponse(
    UUID id,
    String titre,
    String description,
    String type,
    String publicVise,
    String pays,
    String ville,
    String anneeUniversitaire,
    String periode,
    Integer dureeSemaines,
    int nombrePlaces,
    LocalDate dateLimite,
    boolean candidaturesOuvertes,
    String statut,
    String motifRetrait,
    Instant publieeLe,
    Organisme organisme,
    List<Filiere> filieres,
    List<String> classes,
    List<String> piecesDemandees,
    /** Vide dans les listes, où elles ne sont pas affichées. */
    List<PieceJointe> piecesJointes,
    /** Le lecteur peut modifier l'offre et ses documents : son institut ou le chef du service mobilité. */
    boolean modifiable,
    Eligibilite eligibilite
) {
    public record Organisme(UUID id, String nom, String logoUrl, String pays) {
    }

    public record Filiere(UUID id, String nom) {
    }

    public record PieceJointe(UUID id, String nom, long taille) {
    }

    /** Pourquoi le lecteur ne peut pas candidater, si c'est le cas (raison nulle sinon). */
    public record Eligibilite(boolean eligible, String raison) {
    }
}
