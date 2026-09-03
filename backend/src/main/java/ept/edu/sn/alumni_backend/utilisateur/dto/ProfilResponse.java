package ept.edu.sn.alumni_backend.utilisateur.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ProfilResponse(
    UUID id,
    String nom,
    String prenom,
    String email,
    String role,
    String statutCompte,
    String bio,
    String villeResidence,
    String posteActuel,
    String lienLinkedin,
    String lienPortfolio,
    String urlPhoto,
    String telephone,
    LocalDate dateNaissance,
    String filiere,
    Integer anneeSortie
) {}
