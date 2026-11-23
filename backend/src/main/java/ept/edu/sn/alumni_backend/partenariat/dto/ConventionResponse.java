package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;

/**
 * Une convention-cadre. joursRestants n'est renseigné que pour une convention active ; expireBientot signale les
 * 60 derniers jours. Une résiliation signalée prend effet à dateEffetResiliation ; resiliable et resiliationAnnulable
 * disent ce que la personne connectée peut faire. Les pièces ne sont remplies que dans le détail.
 */
public record ConventionResponse(
    UUID id,
    UUID organismeId,
    String organismeNom,
    String organismeLogoUrl,
    String objet,
    String domaines,
    String message,
    StatutConvention statut,
    OrigineConvention origine,
    LocalDate dateSignature,
    LocalDate dateDebut,
    LocalDate dateFin,
    Long joursRestants,
    boolean expireBientot,
    String motifDecision,
    OrigineConvention resiliationDemandeePar,
    LocalDate resiliationDemandeeLe,
    LocalDate dateEffetResiliation,
    boolean resiliable,
    boolean resiliationAnnulable,
    Instant creeeLe,
    Instant modifieeLe,
    List<PieceConventionResponse> pieces
) {
}
