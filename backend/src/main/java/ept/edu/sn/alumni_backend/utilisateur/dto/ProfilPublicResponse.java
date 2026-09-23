package ept.edu.sn.alumni_backend.utilisateur.dto;

import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.parcours.dto.ExperienceResponse;
import ept.edu.sn.alumni_backend.parcours.dto.FormationResponse;

public record ProfilPublicResponse(
    UUID id,
    String nom,
    String prenom,
    String role,
    String statutCompte,
    String bio,
    String villeResidence,
    String posteActuel,
    String lienLinkedin,
    String lienPortfolio,
    String urlPhoto,
    String filiere,
    Integer anneeSortie,
    List<ExperienceResponse> experiences,
    List<FormationResponse> formations
) {}
