package ept.edu.sn.alumni_backend.stage.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Stage d'un étudiant. Pour une offre, c'est d'abord une ligne de la liste définitive en brouillon, confirmée à la
 * publication (STA-04). Une seule ligne par offre et par étudiant : retiré puis rajouté, c'est la même ligne. Les
 * dates sont obligatoires à la confirmation, pour interdire deux stages confirmés qui se chevauchent.
 */
@Entity
@Table(name = "stage",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_stage_offre_etudiant", columnNames = {"offre_id", "etudiant_id"}),
        @UniqueConstraint(name = "uk_stage_candidature", columnNames = "candidature_id")
    },
    indexes = @Index(name = "ix_stage_etudiant_statut", columnList = "etudiant_id, statut"))
@Getter
@Setter
@NoArgsConstructor
public class Stage {
    public static final int LONGUEUR_MOTIF = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "etudiant_id", nullable = false)
    private Utilisateur etudiant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    /** Vide pour un stage trouvé hors offre (STA-10). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offre_id")
    private OffreStage offre;

    /** Vide si l'étudiant a été placé sur la liste sans avoir postulé. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidature_id")
    private Candidature candidature;

    @Convert(converter = EnumTexteConverters.TypeStageConverter.class)
    @Column(name = "type_stage", nullable = false, length = 20)
    private TypeStage typeStage;

    @Column(nullable = false, length = 150)
    private String sujet;

    @Column(length = 150)
    private String lieu;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Convert(converter = EnumTexteConverters.StatutStageConverter.class)
    @Column(nullable = false, length = 20)
    private StatutStage statut;

    /** Motif d'une annulation. */
    @Column(length = LONGUEUR_MOTIF)
    private String motif;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cree_par_id", nullable = false)
    private Utilisateur creePar;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @Column(name = "confirme_le")
    private Instant confirmeLe;

    @Column(name = "annule_le")
    private Instant annuleLe;

    @Version
    private long version;

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
    }

    public void confirmer() {
        statut = StatutStage.CONFIRME;
        confirmeLe = Instant.now();
        motif = null;
        annuleLe = null;
    }

    public void annuler(String motifAnnulation) {
        statut = StatutStage.ANNULE;
        motif = motifAnnulation;
        annuleLe = Instant.now();
    }

    public boolean datesRenseignees() {
        return dateDebut != null && dateFin != null;
    }
}
