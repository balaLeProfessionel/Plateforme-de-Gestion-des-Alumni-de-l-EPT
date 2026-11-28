package ept.edu.sn.alumni_backend.emploi.evenement;

import java.util.UUID;

/**
 * Décision de l'administration sur une offre d'emploi (publiée, refusée, retirée), pour son auteur (#224) :
 * envoyée par notification et par e-mail une fois la décision validée en base.
 */
public record DecisionOffreEmploi(UUID destinataireId, String email, String sujet, String message, String lien) {
}
