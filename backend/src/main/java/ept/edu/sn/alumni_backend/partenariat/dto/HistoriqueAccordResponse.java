package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.Instant;

import ept.edu.sn.alumni_backend.partenariat.ActionAccord;

/** Une ligne de l'historique d'un accord ; auteur vaut « Plateforme » pour le début et la fin automatiques. */
public record HistoriqueAccordResponse(ActionAccord action, String details, String motif, String auteur, Instant date) {
}
