package ept.edu.sn.alumni_backend.messagerie.dto;

import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.AccesCommunaute;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;

/**
 * Carte d'une communauté à découvrir. {@code membresDeMaPromo} : membres qui ont la même année de sortie que moi
 * (0 si mon profil n'en a pas).
 */
public record CommunauteResponse(UUID id, String nom, String description, String urlPhoto, CategorieCommunaute categorie,
    AccesCommunaute acces, long nombreMembres, long membresDeMaPromo) {}
