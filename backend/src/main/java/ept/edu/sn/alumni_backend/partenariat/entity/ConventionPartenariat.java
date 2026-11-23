package ept.edu.sn.alumni_backend.partenariat.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

/**
 * Convention-cadre de partenariat entre l'EPT et un organisme, de la demande à la fin de validité. Distincte de la
 * convention de stage d'un étudiant (ConventionStage) et des accords de stage ou de mobilité.
 */
@Entity
@Table(name = "convention_partenariat", indexes = {
    @Index(name = "ix_convention_partenariat_organisme", columnList = "organisme_id"),
    @Index(name = "ix_convention_partenariat_statut", columnList = "statut, date_fin")
})
@Check(name = "ck_convention_partenariat_dates", constraints = "date_debut is null or date_fin is null or date_debut <= date_fin")
@Getter
@Setter
public class ConventionPartenariat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    @Column(nullable = false, length = 200)
    private String objet;

    /** Domaines de coopération envisagés (stages, recherche, mobilité, formation…), en texte libre. */
    @Column(length = 1000)
    private String domaines;

    /** Présentation de la demande par l'organisme. */
    @Column(length = 3000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutConvention statut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrigineConvention origine;

    @Column(name = "date_signature")
    private LocalDate dateSignature;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    /** Motif du dernier refus ou de la résiliation, communiqué à l'organisme. */
    @Column(name = "motif_decision", length = 500)
    private String motifDecision;

    /** L'alerte « arrive à expiration » n'est envoyée qu'une fois par date de fin. */
    @Column(name = "alerte_expiration_envoyee", nullable = false)
    private boolean alerteExpirationEnvoyee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cree_par_id", nullable = false)
    private Utilisateur creePar;

    @Column(name = "creee_le", nullable = false, updatable = false)
    private Instant creeeLe;

    @Column(name = "modifiee_le", nullable = false)
    private Instant modifieeLe;

    @OneToMany(mappedBy = "convention")
    @OrderBy("ajouteeLe asc")
    @BatchSize(size = 50)
    private List<PieceConventionPartenariat> pieces = new ArrayList<>();

    @Version
    private long version;

    @PrePersist
    void initialiserDates() {
        creeeLe = Instant.now();
        modifieeLe = creeeLe;
    }

    @PreUpdate
    void majDate() {
        modifieeLe = Instant.now();
    }
}
