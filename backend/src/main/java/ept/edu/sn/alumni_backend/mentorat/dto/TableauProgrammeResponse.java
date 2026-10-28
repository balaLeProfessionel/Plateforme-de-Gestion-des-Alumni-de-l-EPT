package ept.edu.sn.alumni_backend.mentorat.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;

/**
 * Tableau de bord d'un programme pour l'administration : où en sont les mentorats et leurs étapes.
 * Ni objectifs, ni comptes rendus, ni évaluations : ils restent entre mentor et mentoré.
 */
public record TableauProgrammeResponse(
    long enAttente,
    long enCours,
    long terminees,
    /** Demandes refusées ou annulées. */
    long sansSuite,
    /** Part des étapes franchies par les mentorats suivis (en cours ou terminés), en pourcentage arrondi. */
    int progressionMoyenne,
    List<AvancementEtape> etapes,
    List<MentoratSuivi> mentorats,
    List<MentorVolontaire> mentors
) {
    /** {@code franchies} sur le nombre de mentorats suivis (en cours ou terminés). */
    public record AvancementEtape(UUID id, short ordre, String titre, long franchies, long suivis) {
    }

    public record MentoratSuivi(
        UUID id,
        StatutMentorat statut,
        ParticipantMentoratResponse mentor,
        ParticipantMentoratResponse mentore,
        int etapesFranchies,
        Instant creeLe
    ) {
    }

    public record MentorVolontaire(ParticipantMentoratResponse mentor, long mentoresEnCours, boolean disponible) {
    }
}
