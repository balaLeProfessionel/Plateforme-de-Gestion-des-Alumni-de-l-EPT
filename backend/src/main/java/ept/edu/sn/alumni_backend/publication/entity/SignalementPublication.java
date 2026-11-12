package ept.edu.sn.alumni_backend.publication.entity;

import java.time.Instant;
import java.util.UUID;
import ept.edu.sn.alumni_backend.publication.MotifSignalement;
import ept.edu.sn.alumni_backend.publication.StatutSignalement;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Signalement d'une publication par un membre, examiné par l'administration. Un seul par membre et par publication. */
@Entity
@Table(name = "signalements_publication",
    uniqueConstraints = @UniqueConstraint(name = "uk_signalement_publication_auteur",
        columnNames = {"publication_id", "auteur_id"}),
    indexes = @Index(name = "ix_signalements_statut_date", columnList = "statut, cree_le"))
@Getter
@Setter
public class SignalementPublication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "publication_id", nullable = false)
    private Publication publication;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MotifSignalement motif;

    @Column(length = 500)
    private String detail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutSignalement statut = StatutSignalement.EN_ATTENTE;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    /** Administrateur qui a tranché ; vide tant que le signalement est en attente. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_id")
    private Utilisateur traitePar;

    @Column(name = "traite_le")
    private Instant traiteLe;

    @Version
    private long version;

    @PrePersist
    void initialiserDate() { creeLe = Instant.now(); }
}
