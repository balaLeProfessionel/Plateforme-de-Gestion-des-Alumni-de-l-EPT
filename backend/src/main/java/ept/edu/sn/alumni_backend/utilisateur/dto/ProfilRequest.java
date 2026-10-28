package ept.edu.sn.alumni_backend.utilisateur.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// Tous les champs sont optionnels : le profil est facultatif et se remplit
// par morceaux (mise a jour partielle facon PATCH)
public record ProfilRequest(
    @NotBlank(message = "Le nom ne peut pas être vide")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    String nom,
    @NotBlank(message = "Le prénom ne peut pas être vide")
    @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
    String prenom,
    @Size(max = 1000, message = "La biographie ne peut pas dépasser 1000 caractères")
    String bio,
    @Size(max = 255, message = "La ville ne peut pas dépasser 255 caractères")
    String villeResidence,
    @Size(max = 255, message = "Le poste ne peut pas dépasser 255 caractères")
    String posteActuel,
    @Size(max = 255, message = "Le lien LinkedIn ne peut pas dépasser 255 caractères")
    @Pattern(regexp = "^(https?://\\S+)?$", message = "Le lien LinkedIn doit commencer par http:// ou https://")
    String lienLinkedin,
    @Size(max = 255, message = "Le portfolio ne peut pas dépasser 255 caractères")
    @Pattern(regexp = "^(https?://\\S+)?$", message = "Le portfolio doit commencer par http:// ou https://")
    String lienPortfolio,
    @Size(max = 30, message = "Le téléphone ne peut pas dépasser 30 caractères")
    String telephone,
    @Past(message = "La date de naissance doit être dans le passé")
    LocalDate dateNaissance,
    Boolean effacerDateNaissance
) {}
