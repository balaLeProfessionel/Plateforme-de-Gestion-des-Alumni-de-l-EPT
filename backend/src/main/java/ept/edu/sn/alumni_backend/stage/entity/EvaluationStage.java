package ept.edu.sn.alumni_backend.stage.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

import ept.edu.sn.alumni_backend.stage.AppreciationGenerale;
import ept.edu.sn.alumni_backend.stage.CritereEvaluation;
import ept.edu.sn.alumni_backend.stage.NiveauCritere;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.MapKeyEnumerated;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Évaluation du stagiaire par le maître de stage (STA-06), sur la grille de la fiche de l'école. Brouillon tant
 * qu'elle n'est pas soumise ; soumise, elle est verrouillée jusqu'à ce que l'administrateur Stages la rouvre.
 * L'avis du tuteur est indicatif : la validation finale du stage est la décision de l'administrateur Stages.
 */
@Entity
@Table(name = "evaluation_stage", uniqueConstraints = @UniqueConstraint(name = "uk_evaluation_stage", columnNames = "stage_id"))
@Getter
@Setter
@NoArgsConstructor
public class EvaluationStage {
    public static final int LONGUEUR_TEXTE = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "evaluation_stage_critere", joinColumns = @JoinColumn(name = "evaluation_id"))
    @MapKeyEnumerated(EnumType.STRING)
    @MapKeyColumn(name = "critere", length = 40)
    @Enumerated(EnumType.STRING)
    @Column(name = "niveau", nullable = false, length = 20)
    private Map<CritereEvaluation, NiveauCritere> criteres = new EnumMap<>(CritereEvaluation.class);

    /** En mois, comme sur la fiche (0,5 pour deux semaines). */
    @Column(name = "duree_effective_mois", precision = 3, scale = 1)
    private BigDecimal dureeEffectiveMois;

    @Column(name = "points_forts", length = LONGUEUR_TEXTE)
    private String pointsForts;

    @Column(name = "axes_amelioration", length = LONGUEUR_TEXTE)
    private String axesAmelioration;

    @Column(length = LONGUEUR_TEXTE)
    private String observations;

    @Enumerated(EnumType.STRING)
    @Column(name = "appreciation_generale", length = 30)
    private AppreciationGenerale appreciationGenerale;

    /** Avis du tuteur : stage validé ou non ; vide tant qu'il n'est pas donné. */
    @Column(name = "avis_tuteur_valide")
    private Boolean avisTuteurValide;

    /** Saisie par l'administrateur Stages, pour un organisme sans compte. */
    @Column(name = "saisie_par_ecole", nullable = false)
    private boolean saisieParEcole;

    @Column(name = "soumise_le")
    private Instant soumiseLe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "soumise_par_id")
    private Utilisateur soumisePar;

    /** Validation finale du stage par l'administrateur Stages ; vide tant qu'il n'a pas décidé. */
    @Column(name = "stage_valide")
    private Boolean stageValide;

    @Column(name = "decide_le")
    private Instant decideLe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decide_par_id")
    private Utilisateur decidePar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    private Utilisateur modifiePar;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @Column(name = "modifie_le")
    private Instant modifieLe;

    @Version
    private long version;

    public EvaluationStage(Stage stage) {
        this.stage = stage;
    }

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
        modifieLe = creeLe;
    }

    @PreUpdate
    void majDate() {
        modifieLe = Instant.now();
    }

    public boolean soumise() {
        return soumiseLe != null;
    }
}
