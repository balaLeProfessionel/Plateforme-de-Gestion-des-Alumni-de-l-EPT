package ept.edu.sn.alumni_backend.admin.dto;

import java.time.LocalDate;

/** Tout ce que l'administration sait d'un compte pour décider, champs privés compris. */
public record FicheCompteResponse(
    CompteAdminResponse compte,
    String villeResidence,
    String posteActuel,
    String lienLinkedin,
    String lienPortfolio,
    String bio,
    String diplome,
    LocalDate dateNaissance,
    boolean doitChangerMotDePasse,
    int nombreFormations,
    int nombreExperiences
) {
}
