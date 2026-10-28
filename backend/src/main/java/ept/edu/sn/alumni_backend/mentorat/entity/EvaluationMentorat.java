package ept.edu.sn.alumni_backend.mentorat.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/** Évaluation de fin de mentorat : une par participant. */
@Entity
@Table(name = "evaluations_mentorat", uniqueConstraints = @UniqueConstraint(
    name = "uk_evaluation_mentorat_auteur",
    columnNames = {"mentorat_id", "auteur_id"}
))
@Check(name = "ck_evaluation_mentorat_note", constraints = "note between 1 and 5")
@Getter
@Setter
public class EvaluationMentorat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentorat_id", nullable = false)
    private Mentorat mentorat;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @Column(nullable = false)
    private int note;

    @Column(length = 1000)
    private String commentaire;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
    }
}
