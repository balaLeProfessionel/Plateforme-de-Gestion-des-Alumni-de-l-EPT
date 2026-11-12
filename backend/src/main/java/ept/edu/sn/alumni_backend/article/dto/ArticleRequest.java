package ept.edu.sn.alumni_backend.article.dto;

import ept.edu.sn.alumni_backend.article.ThemeArticle;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Création ou modification ; résumé et corps peuvent rester vides tant que l'article est un brouillon. */
public record ArticleRequest(
    @NotBlank(message = "Donnez un titre à l'article.") @Size(max = 160) String titre,
    @Size(max = 300) String resume,
    @Size(max = 40000) String contenu,
    @NotNull(message = "Choisissez un thème.") ThemeArticle theme,
    @NotNull AudiencePublication audience
) {}
