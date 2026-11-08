package ept.edu.sn.alumni_backend.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Page d'accueil de l'administration : ce qui attend une décision, l'état de la communauté, les dernières décisions. */
public record TableauDeBordAdminResponse(AFaire aTraiter, Communaute communaute, List<EntreeJournalResponse> dernieresDecisions) {

    /**
     * Inscriptions à examiner et date de la plus ancienne (null s'il n'y en a pas), et nombre d'administrateurs
     * actifs : avec un seul, la plateforme n'a plus de gestionnaire si ce compte perd son accès.
     */
    public record AFaire(long inscriptionsEnAttente, LocalDateTime plusAncienneInscription, long administrateursActifs) {
    }

    public record Communaute(long comptesActifs, long inscritsCeMois, long mentoratsEnCours,
                             long programmesOuverts, long evenementsAVenir) {
    }
}
