package ept.edu.sn.alumni_backend.publication.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.article.entity.Article;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "publications", indexes = {
    @Index(name = "ix_publications_statut_date", columnList = "statut, publie_le"),
    @Index(name = "ix_publications_auteur", columnList = "auteur_id")
})
// Une publication de type ARTICLE porte toujours un article, et elle seule. Hibernate ne pose cette contrainte
// qu'à la création de la table : une base existante la reçoit par script, sinon le service la garantit.
@Check(name = "ck_publications_article", constraints =
    "(type = 'ARTICLE' and article_id is not null) or (type <> 'ARTICLE' and article_id is null)")
@Getter
@Setter
public class Publication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TypePublication type;

    @Column(length = 160)
    private String titre;

    @Column(nullable = false, length = 5000)
    private String contenu;

    @Column(name = "url_image", length = 300)
    private String urlImage;

    /** Description de l'image pour les lecteurs d'écran ; absente sans image. */
    @Column(name = "texte_alternatif", length = 250)
    private String texteAlternatif;

    /** Lien partagé (publication LinkedIn, article…) et son aperçu, figé au moment de la publication. */
    @Column(name = "lien_url", length = 500)
    private String lienUrl;

    @Column(name = "lien_titre", length = 300)
    private String lienTitre;

    @Column(name = "lien_description", length = 600)
    private String lienDescription;

    @Column(name = "lien_site", length = 120)
    private String lienSite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AudiencePublication audience;

    /** Article porté, pour le type {@code ARTICLE} seulement : un article n'a qu'une publication porteuse. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", unique = true)
    private Article article;

    /** Dernier jour pour répondre à un appel à projet (inclus) ; vide pour les autres types. */
    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutPublication statut = StatutPublication.PUBLIE;

    @Column(name = "publie_le", nullable = false, updatable = false)
    private Instant publieLe;

    @Column(nullable = false)
    private Instant modifieLe;

    @PrePersist
    void initialiserDates() {
        Instant maintenant = Instant.now();
        publieLe = maintenant;
        modifieLe = maintenant;
    }

    @PreUpdate
    void actualiserDateModification() {
        modifieLe = Instant.now();
    }
}
