package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Rapport d'un stage (STA-07). etat : SANS_DATE (pas de date limite), ATTENDU, DEPOSE, EN_RETARD (délai passé sans
 * dépôt). depotOuvert : la date limite n'est pas dépassée.
 */
public record RapportResponse(LocalDate dateLimite, String nomFichier, Instant deposeLe, String etat, boolean depotOuvert) {
}
