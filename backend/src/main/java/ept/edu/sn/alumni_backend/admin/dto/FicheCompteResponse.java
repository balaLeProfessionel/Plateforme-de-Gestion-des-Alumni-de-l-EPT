package ept.edu.sn.alumni_backend.admin.dto;

import java.time.LocalDate;
import java.util.List;

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
    int nombreExperiences,
    /** Responsabilités enregistrées d'un compte d'administration (vide pour un membre). */
    List<String> responsabilites
) {
}
