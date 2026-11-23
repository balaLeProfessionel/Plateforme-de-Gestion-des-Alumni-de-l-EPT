package ept.edu.sn.alumni_backend.messagerie.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.messagerie.AccesCommunaute;
import ept.edu.sn.alumni_backend.messagerie.CategorieCommunaute;

/**
 * Une communauté vue par l'administration de la plateforme. {@code automatique} : promo ou filière, dont le nom
 * et l'accès suivent les profils ; seule sa description se modifie.
 */
public record CommunauteAdminResponse(UUID id, String nom, String description, String urlPhoto,
    CategorieCommunaute categorie, AccesCommunaute acces, boolean automatique, long nombreMembres,
    Instant creeLe, Instant derniereActivite) {}
