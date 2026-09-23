package ept.edu.sn.alumni_backend.evenement.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
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
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "evenements")
@Getter
@Setter
public class Evenement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String titre;

    @Column(nullable = false, length = 5000)
    private String description;

    @Column(nullable = false, length = 200)
    private String lieu;

    @Column(nullable = false)
    private Instant dateDebut;

    @Column(nullable = false)
    private Instant dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AudienceEvenement audience;

    private Integer nombrePlaces;

    @Column(nullable = false)
    private boolean officielEpt = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutEvenement statut = StatutEvenement.PUBLIE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organisateur_id", nullable = false)
    private Utilisateur organisateur;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @Column(nullable = false)
    private Instant modifieLe;

    @PrePersist
    void initialiserDates() {
        Instant maintenant = Instant.now();
        creeLe = maintenant;
        modifieLe = maintenant;
    }

    @PreUpdate
    void mettreAJourDateModification() {
        modifieLe = Instant.now();
    }
}
