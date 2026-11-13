package ept.edu.sn.alumni_backend.admin.evenement;

import java.util.UUID;

/**
 * Message pour le titulaire d'un compte, envoyé une fois la décision de l'administration validée en base :
 * par e-mail et dans la cloche (visible dès sa prochaine connexion).
 */
public record NotificationCompte(UUID destinataireId, String destinataire, String sujet, String message) {
}
