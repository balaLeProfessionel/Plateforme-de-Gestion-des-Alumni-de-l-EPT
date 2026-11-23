package ept.edu.sn.alumni_backend.stage.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Stage déclaré par un étudiant, vu par lui-même ou par l'administrateur Stages. organismeId est vide tant que
 * l'organisme proposé n'est pas enregistré ; email de l'étudiant seulement pour l'école.
 */
public record DeclarationResponse(
    UUID id,
    CandidatureRecueResponse.Etudiant etudiant,
    String email,
    UUID organismeId,
    String organisme,
    String typeStage,
    String sujet,
    String lieu,
    LocalDate dateDebut,
    LocalDate dateFin,
    String tuteurNom,
    String tuteurFonction,
    String tuteurEmail,
    String tuteurTelephone,
    String statut,
    String motif,
    Instant creeLe,
    Instant decideLe
) {
}
