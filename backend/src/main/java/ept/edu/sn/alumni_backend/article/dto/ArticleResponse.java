package ept.edu.sn.alumni_backend.article.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.article.StatutArticle;
import ept.edu.sn.alumni_backend.article.ThemeArticle;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;

/**
 * Article complet pour la page de lecture ou l'éditeur.
 * {@code publicationId} : publication porteuse, à utiliser pour les « J'aime », commentaires et signalements
 * (absente pour un brouillon).
 */
public record ArticleResponse(UUID id, UUID publicationId, String titre, String resume, String contenu,
    ThemeArticle theme, String urlCouverture, int tempsLecture, AudiencePublication audience, StatutArticle statut,
    Instant creeLe, Instant modifieLe, Instant publieLe, UUID auteurId, String auteurNom, String auteurPrenom,
    TypeRole auteurRole, String auteurPhoto, boolean estAuteur, long nombreJaime, boolean jaime,
    long nombreCommentaires, UUID auteurOrganismeId) {}
