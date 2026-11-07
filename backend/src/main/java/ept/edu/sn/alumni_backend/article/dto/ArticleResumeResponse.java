package ept.edu.sn.alumni_backend.article.dto;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.article.StatutArticle;
import ept.edu.sn.alumni_backend.article.ThemeArticle;
import ept.edu.sn.alumni_backend.enums.TypeRole;

/** Article dans une liste (bibliothèque, « Mes articles ») : sans le corps. */
public record ArticleResumeResponse(UUID id, UUID publicationId, String titre, String resume, ThemeArticle theme,
    String urlCouverture, int tempsLecture, StatutArticle statut, Instant modifieLe, Instant publieLe, UUID auteurId,
    String auteurNom, String auteurPrenom, TypeRole auteurRole, String auteurPhoto) {}
