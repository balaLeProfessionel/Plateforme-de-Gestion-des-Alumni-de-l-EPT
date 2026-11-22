package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Une offre de stage. Le motif d'un refus ou d'un retrait n'est rempli que pour l'organisme de l'offre et
 * l'administrateur Stages.
 */
public record OffreStageResponse(
    UUID id,
    String titre,
    String description,
    String competences,
    int dureeMois,
    String typeStage,
    String lieu,
    LocalDate dateDebutPrevue,
    Integer nombrePlaces,
    LocalDate dateLimiteCandidature,
    boolean candidaturesOuvertes,
    String statut,
    String motifDecision,
    Instant publieeLe,
    Instant creeeLe,
    Organisme organisme,
    String urlImage,
    /** Pièces jointes PDF ; vide dans les listes, où elles ne sont pas affichées. */
    List<PieceJointe> piecesJointes,
    /** Le lecteur peut changer l'image et les pièces jointes : organisme de l'offre ou administrateur Stages, offre en attente ou publiée. */
    boolean modifiable,
    /** Candidatures envoyées : rempli dans les listes de l'organisme et de l'école, sinon null. */
    Long nombreCandidatures
) {
    public OffreStageResponse avecNombreCandidatures(long nombre) {
        return new OffreStageResponse(id, titre, description, competences, dureeMois, typeStage, lieu, dateDebutPrevue, nombrePlaces,
            dateLimiteCandidature, candidaturesOuvertes, statut, motifDecision, publieeLe, creeeLe, organisme, urlImage, piecesJointes,
            modifiable, nombre);
    }

    public record PieceJointe(UUID id, String nom, long taille) {
    }

    public record Organisme(UUID id, String nom, String logoUrl) {
    }
}
