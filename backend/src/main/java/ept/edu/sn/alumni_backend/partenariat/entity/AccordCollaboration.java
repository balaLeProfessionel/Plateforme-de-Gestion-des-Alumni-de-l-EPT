package ept.edu.sn.alumni_backend.partenariat.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.partenariat.OrigineConvention;
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.TypeAccord;
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
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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
 * Accord de stage ou de mobilité entre l'EPT et un organisme : un document de suivi, sans lien technique avec les
 * offres. Il peut se rattacher à une convention-cadre de l'organisme, sans que ce soit exigé.
 */
@Entity
@Table(name = "accord_collaboration", indexes = {
    @Index(name = "ix_accord_collaboration_organisme", columnList = "organisme_id"),
    @Index(name = "ix_accord_collaboration_statut", columnList = "statut, date_debut, date_fin")
})
@Check(name = "ck_accord_collaboration_dates", constraints = "date_debut <= date_fin")
@Check(name = "ck_accord_collaboration_places", constraints = "nombre_places is null or nombre_places >= 1")
@Getter
@Setter
public class AccordCollaboration {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    /** Convention-cadre de rattachement, facultative. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convention_id")
    private ConventionPartenariat convention;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeAccord type;

    /** Qui a proposé l'accord ; l'autre partie y répond. */
    @Enumerated(EnumType.STRING)
    @Column(name = "propose_par", nullable = false, length = 20)
    private OrigineConvention proposePar;

    @Column(nullable = false, length = 200)
    private String objet;

    @Column(length = 2000)
    private String description;

    /** Étudiants concernés par an ou par session, si l'accord le précise. */
    @Column(name = "nombre_places")
    private Integer nombrePlaces;

    @ManyToMany
    @JoinTable(name = "accord_collaboration_filiere",
        joinColumns = @JoinColumn(name = "accord_id"), inverseJoinColumns = @JoinColumn(name = "filiere_id"))
    @BatchSize(size = 50)
    private Set<Filiere> filieres = new HashSet<>();

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutAccord statut;

    /** Partie qui a signalé la résiliation ; elle prend effet après un préavis de trois mois. */
    @Enumerated(EnumType.STRING)
    @Column(name = "resiliation_demandee_par", length = 20)
    private OrigineConvention resiliationDemandeePar;

    @Column(name = "resiliation_demandee_le")
    private LocalDate resiliationDemandeeLe;

    /** Fin du préavis : l'accord passe alors à RESILIE. */
    @Column(name = "date_effet_resiliation")
    private LocalDate dateEffetResiliation;

    /** Motif d'un refus ou d'une résiliation, communiqué à l'autre partie. */
    @Column(name = "motif_decision", length = 500)
    private String motifDecision;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cree_par_id", nullable = false)
    private Utilisateur creePar;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    @Column(name = "modifie_le", nullable = false)
    private Instant modifieLe;

    @OneToMany(mappedBy = "accord")
    @OrderBy("ajouteeLe asc")
    @BatchSize(size = 50)
    private List<PieceAccord> pieces = new ArrayList<>();

    @Version
    private long version;

    @PrePersist
    void initialiserDates() {
        creeLe = Instant.now();
        modifieLe = creeLe;
    }

    @PreUpdate
    void majDate() {
        modifieLe = Instant.now();
    }
}
