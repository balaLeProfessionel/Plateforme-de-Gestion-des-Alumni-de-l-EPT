package ept.edu.sn.alumni_backend.stage.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
 * Convention tripartite d'un stage confirmé (STA-05). Signée sur papier par l'étudiant, l'organisme et l'école :
 * l'administrateur Stages enregistre la date de chaque signature et dépose le scan. Sujet et encadrants sont lus sur
 * le stage, pour ne pas les tenir à jour à deux endroits.
 */
@Entity
@Table(name = "convention_stage", uniqueConstraints = @UniqueConstraint(name = "uk_convention_stage", columnNames = "stage_id"))
@Getter
@Setter
@NoArgsConstructor
public class ConventionStage {
    public static final int LONGUEUR_TEXTE = 500;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    /** Compagnie et numéro de police couvrant le stagiaire. */
    @Column(length = LONGUEUR_TEXTE)
    private String assurance;

    /** Montant et périodicité, ou « aucune ». */
    @Column(length = LONGUEUR_TEXTE)
    private String indemnite;

    @Column(length = LONGUEUR_TEXTE)
    private String logement;

    @Column(name = "clause_confidentialite", nullable = false)
    private boolean clauseConfidentialite;

    @Column(name = "signee_etudiant_le")
    private LocalDate signeeEtudiantLe;

    @Column(name = "signee_organisme_le")
    private LocalDate signeeOrganismeLe;

    @Column(name = "signee_ecole_le")
    private LocalDate signeeEcoleLe;

    /** Nom de stockage du scan signé (PDF), jamais servi directement. */
    @Column(name = "scan", length = 60)
    private String scan;

    @Column(name = "scan_nom_original", length = 255)
    private String scanNomOriginal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modifie_par_id")
    private Utilisateur modifiePar;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @Column(name = "modifie_le")
    private Instant modifieLe;

    @Version
    private long version;

    public ConventionStage(Stage stage) {
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

    /** Complète : trois signatures et scan enregistrés. */
    public boolean complete() {
        return signeeEtudiantLe != null && signeeOrganismeLe != null && signeeEcoleLe != null && scan != null;
    }
}
