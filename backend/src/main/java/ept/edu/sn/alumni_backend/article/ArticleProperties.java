package ept.edu.sn.alumni_backend.article;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

/** {@code limiteBrouillons} : brouillons ouverts en même temps par un même auteur. */
@Validated
@ConfigurationProperties(prefix = "app.articles")
public record ArticleProperties(@DefaultValue("20") @Min(1) int limiteBrouillons) {}
