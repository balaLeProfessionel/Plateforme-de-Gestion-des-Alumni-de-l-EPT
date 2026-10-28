package ept.edu.sn.alumni_backend.mentorat.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/** Jalon franchi par un mentorat : l'absence de ligne signifie « pas encore atteint ». */
@Entity
@Table(name = "progression_jalons", uniqueConstraints = @UniqueConstraint(
    name = "uk_progression_mentorat_jalon",
    columnNames = {"mentorat_id", "jalon_id"}
))
@Getter
@Setter
public class ProgressionJalon {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentorat_id", nullable = false)
    private Mentorat mentorat;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "jalon_id", nullable = false)
    private JalonProgramme jalon;

    @Column(nullable = false)
    private Instant atteintLe;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "valide_par_id", nullable = false)
    private Utilisateur validePar;

    @Column(length = 500)
    private String commentaire;
}
