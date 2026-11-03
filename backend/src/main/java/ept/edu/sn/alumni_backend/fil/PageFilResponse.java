package ept.edu.sn.alumni_backend.fil;

import java.time.Instant;
import java.util.List;

/**
 * Une page du fil. {@code reference} fige l'instant du premier chargement : la renvoyer pour les pages suivantes
 * garde le même classement, même si de nouvelles publications paraissent entre-temps.
 */
public record PageFilResponse(List<CarteFilResponse> contenu, int page, int taille, boolean derniere, Instant reference) {}
