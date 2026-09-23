package ept.edu.sn.alumni_backend.evenement.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "participations_evenement", uniqueConstraints = @UniqueConstraint(
    name = "uk_participation_evenement_utilisateur",
    columnNames = {"evenement_id", "utilisateur_id"}
))
@Getter
@Setter
public class ParticipationEvenement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evenement_id", nullable = false)
    private Evenement evenement;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReponseParticipation reponse;

    @Column(nullable = false)
    private Instant reponduLe;

    @PrePersist
    void initialiserDateReponse() {
        reponduLe = Instant.now();
    }

    @PreUpdate
    void mettreAJourDateReponse() {
        reponduLe = Instant.now();
    }
}
