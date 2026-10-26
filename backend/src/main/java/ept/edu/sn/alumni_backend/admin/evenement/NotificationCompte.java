package ept.edu.sn.alumni_backend.admin.evenement;

/** Message pour le titulaire d'un compte, envoyé une fois la décision de l'administration validée en base. */
public record NotificationCompte(String destinataire, String sujet, String message) {
}
