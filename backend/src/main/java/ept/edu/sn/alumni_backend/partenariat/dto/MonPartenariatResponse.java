package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Résumé du partenariat d'un organisme avec l'EPT : conventions actives et leur échéance, accords en vigueur par type,
 * propositions de l'école qui attendent sa réponse.
 */
public record MonPartenariatResponse(
    boolean partenaire,
    List<ConventionActive> conventionsActives,
    long accordsStageEnVigueur,
    long accordsMobiliteEnVigueur,
    long accordsAVenir,
    long reponsesAttendues
) {
    public record ConventionActive(UUID id, String objet, LocalDate dateFin, long joursRestants, LocalDate dateEffetResiliation) {
    }
}
