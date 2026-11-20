package ept.edu.sn.alumni_backend.mentorat.evenement;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/**
 * Message à transmettre à un participant une fois le changement de mentorat validé en base :
 * par e-mail et dans la cloche de l'application, avec la page à ouvrir.
 */
public record NotificationMentorat(UUID destinataireId, String destinataire, String sujet, String message, String lien) {
    public static NotificationMentorat pour(Utilisateur destinataire, String sujet, String message, String lien) {
        return new NotificationMentorat(destinataire.getId(), destinataire.getEmail(), sujet, message, lien);
    }

    /** Heure de Dakar, en toutes lettres : « jeudi 12 novembre 2026 à 09:00 ». */
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter
        .ofPattern("EEEE d MMMM yyyy 'à' HH:mm", Locale.FRENCH).withZone(ZoneId.of("Africa/Dakar"));

    public static String date(Instant instant) {
        return FORMAT_DATE.format(instant);
    }

    public static String lienSuivi(UUID mentoratId) {
        return "/mentorat/suivi/" + mentoratId;
    }
}
