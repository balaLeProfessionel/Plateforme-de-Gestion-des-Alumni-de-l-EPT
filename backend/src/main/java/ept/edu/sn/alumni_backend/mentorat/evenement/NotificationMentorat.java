package ept.edu.sn.alumni_backend.mentorat.evenement;

/** Message à transmettre à un participant une fois le changement de mentorat validé en base. */
public record NotificationMentorat(String destinataire, String sujet, String message) {
}
