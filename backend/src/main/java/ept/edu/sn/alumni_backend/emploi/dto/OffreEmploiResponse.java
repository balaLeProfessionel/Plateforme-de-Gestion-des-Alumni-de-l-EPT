package ept.edu.sn.alumni_backend.emploi.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Une offre d'emploi. Le motif d'un refus ou d'un retrait n'est rempli que pour son auteur et l'administration.
 * L'auteur ne montre ni e-mail ni téléphone.
 */
public record OffreEmploiResponse(
    UUID id,
    String mode,
    String titre,
    String description,
    String entreprise,
    UUID organismeId,
    String typeContrat,
    String lieu,
    LocalDate dateExpiration,
    boolean expiree,
    String lienSource,
    String source,
    List<String> competences,
    List<Filiere> filieres,
    String statut,
    String motifDecision,
    Auteur auteur,
    Instant publieeLe,
    Instant creeeLe,
    /** Le lecteur gère l'offre (son auteur, ou son organisme pour une offre gérée) et elle se modifie encore. */
    boolean modifiable,
    /** Le lecteur peut signaler l'offre : publiée, d'un autre membre, pas encore signalée par lui. */
    boolean signalable,
    /** Offre gérée : la lettre de motivation est exigée. */
    boolean lettreExigee,
    /** Offre gérée : questions posées aux candidats, dans l'ordre. */
    List<Question> questions,
    /** Offre gérée dont le recrutement est clôturé (#223) : plus de candidature ni de modification. */
    boolean cloturee,
    /** Offre gérée dont le lecteur traite les candidatures : son organisme ou l'administration des offres. */
    boolean candidaturesConsultables,
    /** « Mes offres » d'un organisme : candidatures reçues (hors retirées), dont celles à traiter ; null ailleurs. */
    Candidatures candidatures
) {
    public record Candidatures(long total, long aTraiter) {
    }

    public record Question(UUID id, String intitule, String type, boolean obligatoire) {
    }

    public record Filiere(UUID id, String nom) {
    }

    /** Qui a publié ou relayé l'offre : « Relayée par Awa Diop, promo 2019 ». */
    public record Auteur(UUID id, String prenom, String nom, String photo, String role, Integer anneeSortie, String filiere,
            UUID organismeId) {
    }
}
