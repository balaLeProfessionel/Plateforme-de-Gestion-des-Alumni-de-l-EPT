package ept.edu.sn.alumni_backend.mobilite.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.mobilite.SensMobilite;
import ept.edu.sn.alumni_backend.mobilite.StatutMobilite;
import ept.edu.sn.alumni_backend.mobilite.TypeMobilite;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Une mobilité, dans un sens ou dans l'autre : base du suivi et des flux entre l'EPT et ses partenaires. Une sortante
 * vient d'une candidature retenue ; une entrante décrit un étudiant accueilli, qui n'a pas de compte.
 */
@Entity
@Table(name = "mobilite", indexes = {
    @Index(name = "ix_mobilite_organisme_annee", columnList = "organisme_id, annee_universitaire"),
    @Index(name = "ix_mobilite_statut", columnList = "statut")
})
@Getter
@Setter
@NoArgsConstructor
public class Mobilite {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SensMobilite sens;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidature_id", unique = true)
    private CandidatureMobilite candidature;

    /** Sortante : le membre de l'EPT qui part. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id")
    private Utilisateur participant;

    /** Entrante : l'étudiant accueilli, sans compte. */
    @Column(length = 100)
    private String prenom;

    @Column(length = 100)
    private String nom;

    @Column(length = 150)
    private String email;

    @Column(name = "programme_origine", length = 150)
    private String programmeOrigine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_accueil_id")
    private Filiere filiereAccueil;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mobilite", nullable = false, length = 30)
    private TypeMobilite type;

    @Column(name = "annee_universitaire", nullable = false, length = 9)
    private String anneeUniversitaire;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutMobilite statut;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creee_par_id", nullable = false)
    private Utilisateur creeePar;

    @Column(name = "creee_le", nullable = false, updatable = false)
    private Instant creeeLe;

    @Version
    private long version;

    @PrePersist
    void initialiserDate() {
        creeeLe = Instant.now();
    }

    /** Mobilité sortante prévue pour une candidature retenue. */
    public static Mobilite sortante(CandidatureMobilite candidature, Utilisateur auteur) {
        OffreMobilite offre = candidature.getOffre();
        Mobilite mobilite = new Mobilite();
        mobilite.setSens(SensMobilite.SORTANTE);
        mobilite.setOrganisme(offre.getOrganisme());
        mobilite.setCandidature(candidature);
        mobilite.setParticipant(candidature.getCandidat());
        mobilite.setType(offre.getType());
        mobilite.setAnneeUniversitaire(offre.getAnneeUniversitaire());
        mobilite.setStatut(StatutMobilite.PREVUE);
        mobilite.setCreeePar(auteur);
        return mobilite;
    }
}
