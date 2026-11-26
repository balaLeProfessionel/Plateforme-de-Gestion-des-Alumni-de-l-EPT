package ept.edu.sn.alumni_backend.utilisateur.dto;

import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.competence.dto.LangueResponse;
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
    String classe,
    Integer anneeSortie,
    List<ExperienceResponse> experiences,
    List<FormationResponse> formations,
    String situationActuelle,
    String paysResidence,
    List<String> competences,
    List<LangueResponse> langues
) {}
