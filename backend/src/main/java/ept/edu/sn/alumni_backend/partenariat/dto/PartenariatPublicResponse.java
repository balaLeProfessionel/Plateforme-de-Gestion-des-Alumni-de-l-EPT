package ept.edu.sn.alumni_backend.partenariat.dto;

import java.time.LocalDate;
import java.util.List;

/** Bloc « Partenaire de l'EPT » de la fiche d'un organisme : depuis quand, domaines de coopération, accords en vigueur. */
public record PartenariatPublicResponse(LocalDate partenaireDepuis, List<String> domaines, boolean accordsStage, boolean accordsMobilite) {
}
