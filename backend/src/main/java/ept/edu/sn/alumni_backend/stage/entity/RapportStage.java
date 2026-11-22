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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Rapport de stage (STA-07) : date limite fixée par l'administrateur Stages, puis PDF déposé par l'étudiant,
 * remplaçable jusqu'à cette date incluse. Un nouveau dépôt écrase le précédent.
 */
@Entity
@Table(name = "rapport_stage", uniqueConstraints = @UniqueConstraint(name = "uk_rapport_stage", columnNames = "stage_id"))
@Getter
@Setter
@NoArgsConstructor
public class RapportStage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stage_id", nullable = false)
    private Stage stage;

    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "date_limite_par_id")
    private Utilisateur dateLimitePar;

    /** Nom de stockage du PDF, jamais servi directement. */
    @Column(length = 60)
    private String fichier;

    @Column(name = "nom_original", length = 255)
    private String nomOriginal;

    @Column(name = "depose_le")
    private Instant deposeLe;

    @Version
    private long version;

    public RapportStage(Stage stage) {
        this.stage = stage;
    }

    public boolean depotOuvert(LocalDate aujourdhui) {
        return dateLimite != null && !aujourdhui.isAfter(dateLimite);
    }
}
