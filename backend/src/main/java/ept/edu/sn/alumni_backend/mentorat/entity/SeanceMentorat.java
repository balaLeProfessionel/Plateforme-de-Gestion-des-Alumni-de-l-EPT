package ept.edu.sn.alumni_backend.mentorat.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.mentorat.ModaliteSeance;
import ept.edu.sn.alumni_backend.mentorat.StatutSeance;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "seances_mentorat", indexes = @Index(name = "ix_seance_mentorat_debut", columnList = "mentorat_id, debut"))
@Check(name = "ck_seance_mentorat_duree", constraints = "duree_minutes between 15 and 240")
@Getter
@Setter
public class SeanceMentorat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentorat_id", nullable = false)
    private Mentorat mentorat;

    @Column(nullable = false)
    private Instant debut;

    @Column(name = "duree_minutes", nullable = false)
    private int dureeMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ModaliteSeance modalite;

    @Column(length = 500)
    private String lieuOuLien;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutSeance statut = StatutSeance.PLANIFIEE;

    @Column(length = 4000)
    private String compteRendu;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proposee_par_id", nullable = false)
    private Utilisateur proposeePar;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @Column(nullable = false)
    private Instant modifieLe;

    @PrePersist
    void initialiserDates() {
        creeLe = Instant.now();
        modifieLe = creeLe;
    }

    @PreUpdate
    void mettreAJourDateModification() {
        modifieLe = Instant.now();
    }
}
