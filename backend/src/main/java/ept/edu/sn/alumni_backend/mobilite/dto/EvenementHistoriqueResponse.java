package ept.edu.sn.alumni_backend.mobilite.dto;

import java.time.Instant;

/** Une ligne de l'historique : quoi, qui, quand, pourquoi. */
public record EvenementHistoriqueResponse(String objet, String action, String details, String motif, String auteur, Instant date) {
}
