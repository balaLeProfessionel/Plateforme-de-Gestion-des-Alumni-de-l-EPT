package ept.edu.sn.alumni_backend.mentorat.entity;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.mentorat.StatutProgramme;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Programme de mentorat encadré par l'école, sur une période en jours calendaires. */
@Entity
@Table(name = "programmes_mentorat")
@Check(name = "ck_programme_mentorat_dates", constraints = "date_fin >= date_debut")
@Getter
@Setter
public class ProgrammeMentorat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(length = 4000)
    private String description;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutProgramme statut = StatutProgramme.BROUILLON;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsable_id", nullable = false)
    private Utilisateur responsable;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
    }

    /** Les dates d'un programme sont des jours à Thiès : on les compare au jour qu'il y est. */
    public static LocalDate aujourdhui() {
        return LocalDate.now(ZoneId.of("Africa/Dakar"));
    }

    /** Sa date de fin est passée : plus de nouvelle demande ni de nouveau mentor volontaire. */
    public boolean estTermine() {
        return dateFin.isBefore(aujourdhui());
    }

    public String dateFinEnToutesLettres() {
        return dateFin.format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH));
    }
}
