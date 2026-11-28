package ept.edu.sn.alumni_backend.cv.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Check;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import ept.edu.sn.alumni_backend.cv.StatutImportCv;
import ept.edu.sn.alumni_backend.cv.TypeSourceCv;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Un import de CV. Le fichier n'est jamais conservé : seul le profil extrait est gardé, le temps que le membre
 * le relise (7 jours au plus), puis il est effacé. La ligne reste pour les statistiques et le suivi du coût.
 */
@Entity
@Table(name = "imports_cv",
    indexes = @Index(name = "ix_imports_cv_utilisateur", columnList = "utilisateur_id, cree_le"))
@Check(name = "ck_imports_cv_nombre_fichiers", constraints = "nombre_fichiers between 1 and 6")
@Getter
@Setter
public class ImportCv {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false, foreignKey = @ForeignKey(name = "fk_imports_cv_utilisateur"))
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutImportCv statut;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_source", nullable = false, length = 10)
    private TypeSourceCv typeSource;

    @Column(name = "nombre_fichiers", nullable = false)
    private short nombreFichiers;

    @Column(length = 40)
    private String fournisseur;

    @Column(length = 80)
    private String modele;

    /** Profil extrait (JSON), présent seulement tant que l'import est PRET. */
    @JdbcTypeCode(SqlTypes.JSON)
    private String resultat;

    @Column(name = "message_erreur", length = 500)
    private String messageErreur;

    @Column(name = "jetons_entree")
    private Integer jetonsEntree;

    @Column(name = "jetons_sortie")
    private Integer jetonsSortie;

    @Column(name = "consentement_le", nullable = false)
    private Instant consentementLe;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @Column(name = "termine_le")
    private Instant termineLe;

    @Column(name = "expire_le")
    private Instant expireLe;

    @PrePersist
    void avantCreation() {
        if (creeLe == null) creeLe = Instant.now();
    }

    /** Efface le brouillon : appelé dès que l'import quitte l'état PRET. */
    public void cloturer(StatutImportCv statutFinal) {
        this.statut = statutFinal;
        this.resultat = null;
        this.expireLe = null;
    }
}
