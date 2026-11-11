package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Convention d'un stage, avec le stage auquel elle se rapporte. Tant qu'aucune clause n'a été saisie, existe vaut false
 * et les champs sont vides.
 */
public record ConventionResponse(
    SuiviStageResponse stage,
    boolean existe,
    String assurance,
    String indemnite,
    String logement,
    boolean clauseConfidentialite,
    LocalDate signeeEtudiantLe,
    LocalDate signeeOrganismeLe,
    LocalDate signeeEcoleLe,
    String scanNom,
    String etat,
    Instant modifieLe
) {
}
