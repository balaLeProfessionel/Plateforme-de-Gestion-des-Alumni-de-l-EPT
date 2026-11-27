package ept.edu.sn.alumni_backend.emploi.entity;

import ept.edu.sn.alumni_backend.competence.entity.Competence;
import ept.edu.sn.alumni_backend.emploi.ModeOffreEmploi;
import ept.edu.sn.alumni_backend.emploi.StatutOffreEmploi;
import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
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
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

/**
 * Offre d'emploi (#221). Une offre relayée nomme son entreprise en texte libre et renvoie vers l'offre d'origine ;
 * une offre gérée (#222) appartient à un organisme et reçoit ses candidatures dans la plateforme.
 */
@Entity
@Table(name = "offre_emploi", indexes = {
    @Index(name = "ix_offre_emploi_statut_expiration", columnList = "statut, date_expiration"),
    @Index(name = "ix_offre_emploi_auteur", columnList = "auteur_id")
})
@Getter
@Setter
@NoArgsConstructor
public class OffreEmploi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModeOffreEmploi mode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    /** Organisme qui recrute : rempli pour une offre gérée, vide pour une offre relayée. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisme_id")
    private Organisme organisme;

    /** Entreprise qui recrute, en texte libre : offre relayée. */
    @Column(name = "nom_entreprise", length = 150)
    private String nomEntreprise;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(nullable = false, length = 5000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_contrat", nullable = false, length = 30)
    private TypeContrat typeContrat;

    @Column(nullable = false, length = 150)
    private String lieu;

    @Column(name = "date_expiration", nullable = false)
    private LocalDate dateExpiration;

    /** Adresse de l'offre d'origine : offre relayée. */
    @Column(name = "lien_source", length = 500)
    private String lienSource;

    /** Où l'offre a été vue (LinkedIn, site de l'entreprise…), facultatif. */
    @Column(length = 60)
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutOffreEmploi statut;

    /** Motif d'un refus ou d'un retrait par l'administration (#224). */
    @Column(name = "motif_decision", length = 500)
    private String motifDecision;

    @ManyToMany
    @JoinTable(name = "offre_emploi_competence",
        joinColumns = @JoinColumn(name = "offre_id"),
        inverseJoinColumns = @JoinColumn(name = "competence_id"))
    @OrderBy("libelle")
    @BatchSize(size = 50)
    private Set<Competence> competences = new LinkedHashSet<>();

    /** Filières visées ; aucune : l'offre s'adresse à toutes les filières. */
    @ManyToMany
    @JoinTable(name = "offre_emploi_filiere",
        joinColumns = @JoinColumn(name = "offre_id"),
        inverseJoinColumns = @JoinColumn(name = "filiere_id"))
    @OrderBy("nom")
    @BatchSize(size = 50)
    private Set<Filiere> filieres = new LinkedHashSet<>();

    /** Offre gérée : la lettre de motivation est exigée (sinon facultative). */
    @Column(name = "lettre_exigee", nullable = false, columnDefinition = "boolean not null default false")
    private boolean lettreExigee;

    /** Offre gérée : questions posées aux candidats, dans l'ordre. */
    @OneToMany(mappedBy = "offre", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre")
    @BatchSize(size = 50)
    private List<QuestionOffreEmploi> questions = new ArrayList<>();

    @Column(name = "creee_le", nullable = false, updatable = false)
    private Instant creeeLe;

    @Column(name = "publiee_le")
    private Instant publieeLe;

    @Column(name = "modifiee_le")
    private Instant modifieeLe;

    /**
     * Offre gérée dont l'organisme a clôturé le recrutement (#223) : elle reste lisible des candidats mais ne reçoit plus de
     * candidature ni de modification ; les candidatures encore ouvertes sont passées en NON_RETENUE.
     */
    @Column(name = "cloturee_le")
    private Instant clotureeLe;

    @Version
    private long version;

    @PrePersist
    void initialiserDates() {
        creeeLe = Instant.now();
    }

    @PreUpdate
    void marquerModification() {
        modifieeLe = Instant.now();
    }

    public void publier() {
        statut = StatutOffreEmploi.PUBLIEE;
        publieeLe = Instant.now();
        motifDecision = null;
    }

    public boolean estExpiree(LocalDate aujourdhui) {
        return dateExpiration.isBefore(aujourdhui);
    }

    public boolean estCloturee() {
        return clotureeLe != null;
    }

    /** Nom de l'entreprise affiché : l'organisme d'une offre gérée, sinon le texte saisi. */
    public String entrepriseAffichee() {
        return organisme != null ? organisme.getNom() : nomEntreprise;
    }
}
