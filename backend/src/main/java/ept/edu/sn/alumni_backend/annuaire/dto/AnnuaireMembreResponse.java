package ept.edu.sn.alumni_backend.annuaire.dto;

import java.util.UUID;

import ept.edu.sn.alumni_backend.mentorat.StatutMentor;

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
    Integer anneeSortie,
    UUID organismeId,
    String typeOrganisme,
    /** null quand le membre ne propose pas de mentorat. */
    StatutMentor mentor
) {}
