package ept.edu.sn.alumni_backend.utilisateur.dto;

import java.time.LocalDate;

// Tous les champs sont optionnels : le profil est facultatif et se remplit
// par morceaux (mise a jour partielle facon PATCH)
public record ProfilRequest(
    String bio,
    String villeResidence,
    String posteActuel,
    String lienLinkedin,
    String lienPortfolio,
    String urlPhoto,
    String telephone,
    LocalDate dateNaissance
) {}
