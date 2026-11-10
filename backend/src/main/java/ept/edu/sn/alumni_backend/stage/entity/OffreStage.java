package ept.edu.sn.alumni_backend.stage.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Offre de stage d'un organisme (STA-01), publiée directement ou après vérification par l'administrateur Stages. */
@Entity
@Table(name = "offre_stage", indexes = {
    @Index(name = "ix_offre_stage_statut_limite", columnList = "statut, date_limite_candidature"),
    @Index(name = "ix_offre_stage_organisme", columnList = "organisme_id")
})
@Getter
@Setter
@NoArgsConstructor
public class OffreStage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(nullable = false, length = 5000)
    private String description;

    @Column(nullable = false, length = 1000)
    private String competences;

    @Column(name = "duree_mois", nullable = false)
    private int dureeMois;

    @Convert(converter = EnumTexteConverters.TypeStageConverter.class)
    @Column(name = "type_stage", nullable = false, length = 20)
    private TypeStage typeStage;

    @Column(length = 150)
    private String lieu;

    @Column(name = "date_debut_prevue")
    private LocalDate dateDebutPrevue;

    /** Indicatif : la liste définitive peut en compter plus ou moins. */
    @Column(name = "nombre_places")
    private Integer nombrePlaces;

    @Column(name = "date_limite_candidature", nullable = false)
    private LocalDate dateLimiteCandidature;

    @Convert(converter = EnumTexteConverters.StatutOffreConverter.class)
    @Column(nullable = false, length = 20)
    private StatutOffre statut;

    /** Motif d'un refus ou d'un retrait par l'administrateur Stages. */
    @Column(name = "motif_decision", length = 500)
    private String motifDecision;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creee_par_id", nullable = false)
    private Utilisateur creeePar;

    @Column(name = "creee_le", nullable = false, updatable = false)
    private Instant creeeLe;

    @Column(name = "publiee_le")
    private Instant publieeLe;

    /** Illustration 16:9 facultative, servie sous /api/offre-images/. */
    @Column(name = "url_image", length = 200)
    private String urlImage;

    @OneToMany(mappedBy = "offre")
    @OrderBy("ajouteeLe")
    @BatchSize(size = 50)
    private List<PieceJointeOffre> piecesJointes = new ArrayList<>();

    @Version
    private long version;

    @PrePersist
    void initialiserDate() {
        creeeLe = Instant.now();
    }

    public void publier() {
        statut = StatutOffre.PUBLIEE;
        publieeLe = Instant.now();
        motifDecision = null;
    }

    public boolean candidaturesOuvertes(LocalDate aujourdhui) {
        return statut == StatutOffre.PUBLIEE && !dateLimiteCandidature.isBefore(aujourdhui);
    }
}
