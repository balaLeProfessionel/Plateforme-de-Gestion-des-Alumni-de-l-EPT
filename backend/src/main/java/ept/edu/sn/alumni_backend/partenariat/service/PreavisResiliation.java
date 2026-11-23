package ept.edu.sn.alumni_backend.partenariat.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import ept.edu.sn.alumni_backend.partenariat.exception.ConflitConventionException;

/**
 * Règle commune aux conventions-cadres et aux accords : chaque partie résilie avec un préavis de trois mois. Le
 * document reste en vigueur jusqu'à la date d'effet ; une résiliation signalée peut être annulée avant cette date.
 */
public final class PreavisResiliation {
    public static final int MOIS = 3;
    static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.FRENCH);

    private PreavisResiliation() {
    }

    /** Date d'effet d'une résiliation signalée aujourd'hui ; refusée si le document se termine avant la fin du préavis. */
    static LocalDate dateEffet(LocalDate dateFin, LocalDate dejaSignalee) {
        if (dejaSignalee != null) {
            throw new ConflitConventionException("La résiliation est déjà signalée : elle prend effet le " + FORMAT_DATE.format(dejaSignalee) + ".");
        }
        LocalDate effet = ConventionsPartenariatService.aujourdhui().plusMonths(MOIS);
        if (dateFin != null && !effet.isBefore(dateFin)) {
            throw new ConflitConventionException("La période de validité se termine le " + FORMAT_DATE.format(dateFin)
                + ", avant la fin du préavis de " + MOIS + " mois : inutile de résilier, la fin interviendra d'elle-même à cette date.");
        }
        return effet;
    }

    static String annonce(String auteur, String document, String motif, LocalDate effet) {
        return auteur + " résilie " + document + " : " + motif + " La résiliation prend effet le " + FORMAT_DATE.format(effet)
            + ", après le préavis de " + MOIS + " mois.";
    }
}
