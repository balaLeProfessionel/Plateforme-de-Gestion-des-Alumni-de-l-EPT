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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import org.hibernate.annotations.BatchSize;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Candidature d'un étudiant ou d'un alumni à une offre gérée (#222) : CV en PDF, lettre et réponses aux questions.
 * Une seule par candidat et par offre ; après un retrait, le candidat peut la renvoyer (même ligne). L'organisme la traite
 * (#223) : statut, note privée jamais montrée au candidat, historique de chaque changement.
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
    public static final int LONGUEUR_NOTE = 2000;

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
    @BatchSize(size = 50)
    private List<ReponseCandidatureEmploi> reponses = new ArrayList<>();

    /** Note du recruteur, réservée à l'organisme de l'offre et à l'administration. */
    @Column(name = "note_privee", length = LONGUEUR_NOTE)
    private String notePrivee;

    /** Le CV a été effacé après la durée de conservation suivant la fin de l'offre (données personnelles). */
    @Column(name = "cv_supprime_le")
    private Instant cvSupprimeLe;

    @OneToMany(mappedBy = "candidature", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("changeLe")
    @BatchSize(size = 50)
    private List<HistoriqueCandidatureEmploi> historique = new ArrayList<>();

    @Version
    private long version;

    public CandidatureEmploi(OffreEmploi offre, Utilisateur candidat) {
        this.offre = offre;
        this.candidat = candidat;
    }

    public void envoyer(String lettre, Utilisateur auteur) {
        lettreMotivation = lettre;
        envoyeeLe = Instant.now();
        retireeLe = null;
        noter(StatutCandidatureEmploi.RECUE, auteur, envoyeeLe);
    }

    public void retirer(Utilisateur auteur) {
        retireeLe = Instant.now();
        noter(StatutCandidatureEmploi.RETIREE, auteur, retireeLe);
    }

    /** Décision du recruteur ; la transition a été vérifiée par l'appelant. */
    public void passerA(StatutCandidatureEmploi nouveau, Utilisateur auteur) {
        noter(nouveau, auteur, Instant.now());
    }

    private void noter(StatutCandidatureEmploi nouveau, Utilisateur auteur, Instant le) {
        statut = nouveau;
        historique.add(new HistoriqueCandidatureEmploi(this, nouveau, auteur, le));
    }

    public void remplacerReponses(List<ReponseCandidatureEmploi> nouvelles) {
        reponses.clear();
        reponses.addAll(nouvelles);
    }
}
