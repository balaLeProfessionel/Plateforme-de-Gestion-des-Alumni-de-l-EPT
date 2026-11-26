package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Tableau de bord du service des Relations extérieures : chiffres clés, ce qui attend une action, partenaires par type
 * d'organisme et activité par année civile (conventions signées, accords acceptés).
 */
public record TableauPartenariatsResponse(
    Chiffres chiffres,
    List<ElementATraiter> aTraiter,
    List<Repartition> partenairesParType,
    List<Annee> parAnnee
) {
    public record Chiffres(
        long partenaires,
        long conventionsActives,
        long demandesEnCours,
        long conventionsExpirees,
        long conventionsResiliees,
        long accordsStageEnVigueur,
        long accordsMobiliteEnVigueur,
        long accordsAVenir,
        long propositionsAExaminer,
        long expirentBientot,
        long resiliationsEnCours
    ) {
    }

    /** Une convention ou un accord qui attend une action ; motif dit pourquoi, date la date utile (dépôt, échéance, effet). */
    public record ElementATraiter(String nature, UUID id, String organismeNom, String objet, String motif, LocalDate date, String lien) {
    }

    public record Repartition(String cle, long nombre) {
    }

    public record Annee(int annee, long conventionsSignees, long accordsStage, long accordsMobilite) {
    }
}
