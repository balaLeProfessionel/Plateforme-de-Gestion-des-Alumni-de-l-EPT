package ept.edu.sn.alumni_backend.publication.dto;

import java.util.UUID;

import ept.edu.sn.alumni_backend.article.ThemeArticle;

/** Article porté par une publication de type {@code ARTICLE}, pour la carte « Lire l'article » du fil. */
public record ArticlePublicationResponse(UUID id, ThemeArticle theme, int tempsLecture) {}
