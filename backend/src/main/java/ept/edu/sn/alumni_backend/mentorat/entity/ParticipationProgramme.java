package ept.edu.sn.alumni_backend.mentorat.entity;

import java.time.Instant;
import java.util.UUID;

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

/** Un mentor volontaire pour un programme : les mentorés du programme le trouvent sur sa page. */
@Entity
@Table(name = "participations_programme", uniqueConstraints = @UniqueConstraint(
    name = "uk_participation_programme_mentor",
    columnNames = {"programme_id", "profil_mentor_id"}
))
@Getter
@Setter
public class ParticipationProgramme {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "programme_id", nullable = false)
    private ProgrammeMentorat programme;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profil_mentor_id", nullable = false)
    private ProfilMentor profilMentor;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
    }
}
