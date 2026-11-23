package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.Instant;

import ept.edu.sn.alumni_backend.partenariat.ActionConvention;

/** Une ligne de l'historique ; auteur vaut « Plateforme » pour une expiration automatique. */
public record HistoriqueConventionResponse(ActionConvention action, String details, String motif, String auteur, Instant date) {
}
