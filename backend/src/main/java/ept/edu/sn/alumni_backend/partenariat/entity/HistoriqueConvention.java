package ept.edu.sn.alumni_backend.partenariat.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.partenariat.ActionConvention;
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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Une opération sur une convention : jamais modifiée ni supprimée. Sans auteur, elle a été faite par la plateforme
 * (expiration à la date de fin).
 */
@Entity
@Table(name = "historique_convention", indexes = @Index(name = "ix_historique_convention", columnList = "convention_id, date_action"))
@Getter
@NoArgsConstructor
public class HistoriqueConvention {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "convention_id", nullable = false)
    private UUID conventionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ActionConvention action;

    @Column(length = 500)
    private String details;

    @Column(length = 500)
    private String motif;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    private Utilisateur auteur;

    @Column(name = "date_action", nullable = false, updatable = false)
    private Instant dateAction;

    public HistoriqueConvention(UUID conventionId, ActionConvention action, String details, String motif, Utilisateur auteur) {
        this.conventionId = conventionId;
        this.action = action;
        this.details = details;
        this.motif = motif;
        this.auteur = auteur;
    }

    @PrePersist
    void initialiserDate() {
        dateAction = Instant.now();
    }
}
