package ept.edu.sn.alumni_backend.admin.dto;

import java.time.LocalDateTime;
import java.util.List;

/** Page d'accueil de l'administration : ce qui attend une décision, l'état de la communauté, les dernières décisions. */
public record TableauDeBordAdminResponse(AFaire aTraiter, Communaute communaute, List<EntreeJournalResponse> dernieresDecisions) {

    /**
     * Inscriptions à examiner et date de la plus ancienne (null s'il n'y en a pas), et nombre de super administrateurs
     * actifs : avec un seul, plus personne ne peut gérer les administrateurs si ce compte perd son accès. Offres d'emploi
     * à modérer (#224) : en attente de vérification, ou publiées et signalées.
     */
    public record AFaire(long inscriptionsEnAttente, LocalDateTime plusAncienneInscription, long superAdministrateursActifs,
                         long offresEmploiAModerer) {
    }

    public record Communaute(long comptesActifs, long inscritsCeMois, long mentoratsEnCours,
                             long programmesOuverts, long evenementsAVenir) {
    }
}
