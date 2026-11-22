package ept.edu.sn.alumni_backend.mobilite.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import ept.edu.sn.alumni_backend.mobilite.StatutCandidatureMobilite;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Candidature d'un étudiant ou d'un enseignant à une offre de mobilité : une seule par offre et par candidat. */
@Entity
@Table(name = "candidature_mobilite",
    uniqueConstraints = @UniqueConstraint(name = "uk_candidature_mobilite_offre_candidat", columnNames = {"offre_id", "candidat_id"}),
    indexes = @Index(name = "ix_candidature_mobilite_candidat", columnList = "candidat_id"))
@Getter
@Setter
@NoArgsConstructor
public class CandidatureMobilite {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private OffreMobilite offre;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Utilisateur candidat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutCandidatureMobilite statut;

    /** Rang sur la liste d'attente, rempli pour LISTE_ATTENTE seulement. */
    @Column(name = "rang_attente")
    private Integer rangAttente;

    @Column(name = "soumise_le", nullable = false)
    private Instant soumiseLe;

    @Column(name = "retiree_le")
    private Instant retireeLe;

    @Column(name = "decidee_le")
    private Instant decideeLe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decidee_par_id")
    private Utilisateur decideePar;

    @OneToMany(mappedBy = "candidature")
    @BatchSize(size = 50)
    private List<PieceCandidatureMobilite> pieces = new ArrayList<>();

    @Version
    private long version;

    public CandidatureMobilite(OffreMobilite offre, Utilisateur candidat) {
        this.offre = offre;
        this.candidat = candidat;
    }

    public void soumettre() {
        statut = StatutCandidatureMobilite.SOUMISE;
        soumiseLe = Instant.now();
        retireeLe = null;
    }

    public void retirer() {
        statut = StatutCandidatureMobilite.RETIREE;
        retireeLe = Instant.now();
    }
}
