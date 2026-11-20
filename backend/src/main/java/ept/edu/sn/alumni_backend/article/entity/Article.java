package ept.edu.sn.alumni_backend.article.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.article.StatutArticle;
import ept.edu.sn.alumni_backend.article.ThemeArticle;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Article de fond. Une fois publié, il est porté par une publication de type {@code ARTICLE}
 * ({@code publications.article_id}), qui reçoit les « J'aime », commentaires et signalements.
 */
@Entity
@Table(name = "articles", indexes = {
    @Index(name = "ix_articles_statut_date", columnList = "statut, publie_le"),
    @Index(name = "ix_articles_theme_statut_date", columnList = "theme, statut, publie_le"),
    @Index(name = "ix_articles_auteur", columnList = "auteur_id")
})
@Getter
@Setter
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @Column(nullable = false, length = 160)
    private String titre;

    /** Facultatif tant que l'article est un brouillon, obligatoire pour publier. */
    @Column(length = 300)
    private String resume;

    /** Markdown limité, jamais de HTML : le frontend le convertit puis le nettoie à l'affichage. */
    @Column(nullable = false, length = 40000)
    private String contenu = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ThemeArticle theme;

    /** {@code stockage:<identifiant>} de l'image recadrée en 16:9 ; vide sans couverture. */
    @Column(name = "url_couverture", length = 300)
    private String urlCouverture;

    /** Minutes, recalculées à chaque enregistrement (200 mots par minute). */
    @Column(name = "temps_lecture", nullable = false)
    private int tempsLecture = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AudiencePublication audience = AudiencePublication.TOUS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutArticle statut = StatutArticle.BROUILLON;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @Column(name = "modifie_le", nullable = false)
    private Instant modifieLe;

    @Column(name = "publie_le")
    private Instant publieLe;

    @PrePersist
    void initialiserDates() {
        Instant maintenant = Instant.now();
        creeLe = maintenant;
        modifieLe = maintenant;
    }

    @PreUpdate
    void actualiserDateModification() {
        modifieLe = Instant.now();
    }
}
