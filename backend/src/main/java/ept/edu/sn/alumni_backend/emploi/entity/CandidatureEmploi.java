package ept.edu.sn.alumni_backend.emploi.entity;

import ept.edu.sn.alumni_backend.emploi.StatutCandidatureEmploi;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.CascadeType;
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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Candidature d'un étudiant ou d'un alumni à une offre gérée (#222) : CV en PDF, lettre et réponses aux questions.
 * Une seule par candidat et par offre ; après un retrait, le candidat peut la renvoyer (même ligne).
 */
@Entity
@Table(name = "candidature_emploi",
    uniqueConstraints = @UniqueConstraint(name = "uk_candidature_emploi_offre_candidat", columnNames = {"offre_id", "candidat_id"}),
    indexes = @Index(name = "ix_candidature_emploi_candidat", columnList = "candidat_id"))
@Getter
@Setter
@NoArgsConstructor
public class CandidatureEmploi {
    public static final int LONGUEUR_LETTRE = 3000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private OffreEmploi offre;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidat_id", nullable = false)
    private Utilisateur candidat;

    /** Nom de stockage du CV, jamais servi directement. */
    @Column(nullable = false, length = 60)
    private String cv;

    /** Nom du fichier tel que le candidat l'a envoyé. */
    @Column(name = "nom_cv", nullable = false)
    private String nomCv;

    @Column(name = "lettre_motivation", length = LONGUEUR_LETTRE)
    private String lettreMotivation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutCandidatureEmploi statut;

    @Column(name = "envoyee_le", nullable = false)
    private Instant envoyeeLe;

    @Column(name = "retiree_le")
    private Instant retireeLe;

    @OneToMany(mappedBy = "candidature", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReponseCandidatureEmploi> reponses = new ArrayList<>();

    @Version
    private long version;

    public CandidatureEmploi(OffreEmploi offre, Utilisateur candidat) {
        this.offre = offre;
        this.candidat = candidat;
    }

    public void envoyer(String lettre) {
        lettreMotivation = lettre;
        statut = StatutCandidatureEmploi.RECUE;
        envoyeeLe = Instant.now();
        retireeLe = null;
    }

    public void retirer() {
        statut = StatutCandidatureEmploi.RETIREE;
        retireeLe = Instant.now();
    }

    public void remplacerReponses(List<ReponseCandidatureEmploi> nouvelles) {
        reponses.clear();
        reponses.addAll(nouvelles);
    }
}
