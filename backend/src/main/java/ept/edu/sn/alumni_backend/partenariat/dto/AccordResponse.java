package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.TypeAccord;

/**
 * Un accord vu par l'organisme ou par l'école. aRepondre : la personne connectée est la partie qui doit accepter ou
 * refuser ; modifiable : elle l'a proposé et l'autre partie n'a pas encore répondu ; resiliable : l'accord est en
 * vigueur ou à venir, sans résiliation en cours. Une résiliation signalée prend effet à dateEffetResiliation.
 */
public record AccordResponse(
    UUID id,
    UUID organismeId,
    String organismeNom,
    UUID conventionId,
    String conventionObjet,
    TypeAccord type,
    OrigineConvention proposePar,
    String objet,
    String description,
    Integer nombrePlaces,
    List<FiliereAccord> filieres,
    LocalDate dateDebut,
    LocalDate dateFin,
    StatutAccord statut,
    String motifDecision,
    OrigineConvention resiliationDemandeePar,
    LocalDate resiliationDemandeeLe,
    LocalDate dateEffetResiliation,
    boolean aRepondre,
    boolean modifiable,
    boolean resiliable,
    /** La personne connectée a signalé la résiliation et peut y renoncer avant la date d'effet. */
    boolean resiliationAnnulable,
    Instant creeLe,
    Instant modifieLe,
    List<PieceConventionResponse> pieces
) {
    public record FiliereAccord(UUID id, String nom) {
    }
}
