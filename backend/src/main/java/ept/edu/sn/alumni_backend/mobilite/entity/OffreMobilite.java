package ept.edu.sn.alumni_backend.mobilite.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.mobilite.PeriodeMobilite;
import ept.edu.sn.alumni_backend.mobilite.PublicVise;
import ept.edu.sn.alumni_backend.mobilite.StatutOffreMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypeMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypePiece;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
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
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Offre de mobilité d'un établissement partenaire, publiée par l'institut lui-même ou par le chef du service mobilité
 * en son nom. Sans filière ni classe, l'offre est ouverte à toutes ; ces conditions ne valent que pour les étudiants.
 */
@Entity
@Table(name = "offre_mobilite", indexes = {
    @Index(name = "ix_offre_mobilite_statut_limite", columnList = "statut, date_limite"),
    @Index(name = "ix_offre_mobilite_organisme", columnList = "organisme_id")
})
@Getter
@Setter
@NoArgsConstructor
public class OffreMobilite {
    public static final int LONGUEUR_DESCRIPTION = 5000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(nullable = false, length = LONGUEUR_DESCRIPTION)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mobilite", nullable = false, length = 30)
    private TypeMobilite type;

    @Enumerated(EnumType.STRING)
    @Column(name = "public_vise", nullable = false, length = 20)
    private PublicVise publicVise;

    @Column(nullable = false, length = 100)
    private String pays;

    @Column(length = 100)
    private String ville;

    /** « 2027-2028 ». */
    @Column(name = "annee_universitaire", nullable = false, length = 9)
    private String anneeUniversitaire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PeriodeMobilite periode;

    /** Rempli pour un séjour (période SEJOUR) seulement. */
    @Column(name = "duree_semaines")
    private Integer dureeSemaines;

    @Column(name = "nombre_places", nullable = false)
    private int nombrePlaces;

    @Column(name = "date_limite", nullable = false)
    private LocalDate dateLimite;

    @ManyToMany
    @JoinTable(name = "offre_mobilite_filiere",
        joinColumns = @JoinColumn(name = "offre_id"), inverseJoinColumns = @JoinColumn(name = "filiere_id"))
    @BatchSize(size = 50)
    private Set<Filiere> filieres = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "offre_mobilite_classe", joinColumns = @JoinColumn(name = "offre_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "classe", nullable = false, length = 20)
    @BatchSize(size = 50)
    private Set<Classe> classes = EnumSet.noneOf(Classe.class);

    @ElementCollection
    @CollectionTable(name = "offre_mobilite_piece_demandee", joinColumns = @JoinColumn(name = "offre_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "type_piece", nullable = false, length = 30)
    @BatchSize(size = 50)
    private Set<TypePiece> piecesDemandees = EnumSet.noneOf(TypePiece.class);

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutOffreMobilite statut = StatutOffreMobilite.PUBLIEE;

    /** Motif d'un retrait par le chef du service mobilité. */
    @Column(name = "motif_retrait", length = 500)
    private String motifRetrait;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creee_par_id", nullable = false)
    private Utilisateur creeePar;

    @Column(name = "creee_le", nullable = false, updatable = false)
    private Instant creeeLe;

    @Column(name = "publiee_le", nullable = false)
    private Instant publieeLe;

    @Column(name = "liste_publiee_le")
    private Instant listePublieeLe;

    @OneToMany(mappedBy = "offre")
    @OrderBy("ajouteeLe")
    @BatchSize(size = 50)
    private List<PieceJointeOffreMobilite> piecesJointes = new ArrayList<>();

    @Version
    private long version;

    @PrePersist
    void initialiserDates() {
        creeeLe = Instant.now();
        if (publieeLe == null) publieeLe = creeeLe;
    }

    public boolean candidaturesOuvertes(LocalDate aujourdhui) {
        return statut == StatutOffreMobilite.PUBLIEE && !dateLimite.isBefore(aujourdhui);
    }

    /** Publiée, close ou liste publiée : l'offre reste consultable par son public. */
    public boolean visible() {
        return statut != StatutOffreMobilite.RETIREE;
    }
}
