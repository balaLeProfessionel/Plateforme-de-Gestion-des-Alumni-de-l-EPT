package ept.edu.sn.alumni_backend.annuaire.dto;

import java.util.UUID;

public record AnnuaireMembreResponse(
    UUID id,
    String nom,
    String prenom,
    String role,
    String statutCompte,
    String urlPhoto,
    String posteActuel,
    String villeResidence,
    String filiere,
    Integer anneeSortie
) {}
