package ept.edu.sn.alumni_backend.utilisateur.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;

// Tous les champs sont optionnels : le profil est facultatif et se remplit
// par morceaux (mise a jour partielle facon PATCH)
public record ProfilRequest(
    String bio,
    String villeResidence,
    String posteActuel,
    @Pattern(regexp = "^(https?://\\S+)?$", message = "Le lien LinkedIn doit commencer par http:// ou https://")
    String lienLinkedin,
    @Pattern(regexp = "^(https?://\\S+)?$", message = "Le portfolio doit commencer par http:// ou https://")
    String lienPortfolio,
    @Pattern(regexp = "^(https?://\\S+)?$", message = "L'URL de la photo doit commencer par http:// ou https://")
    String urlPhoto,
    String telephone,
    @Past(message = "La date de naissance doit être dans le passé")
    LocalDate dateNaissance,
    Boolean effacerDateNaissance
) {}
