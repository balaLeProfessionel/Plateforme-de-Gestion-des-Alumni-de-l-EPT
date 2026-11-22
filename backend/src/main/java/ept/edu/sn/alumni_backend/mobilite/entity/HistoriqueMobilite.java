package ept.edu.sn.alumni_backend.mobilite.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mobilite.ActionHistorique;
import ept.edu.sn.alumni_backend.mobilite.ObjetHistorique;
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
 * Une opération sur une offre, une candidature ou une mobilité : jamais modifiée ni supprimée. Le journal
 * d'administration ne convient pas : il vise un compte et ne consigne que les actions des administrateurs.
 */
@Entity
@Table(name = "historique_mobilite", indexes = @Index(name = "ix_historique_mobilite_objet", columnList = "objet_id, date_action"))
@Getter
@NoArgsConstructor
public class HistoriqueMobilite {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ObjetHistorique objet;

    @Column(name = "objet_id", nullable = false)
    private UUID objetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ActionHistorique action;

    /** Ce qui a changé, lisible tel quel (« date limite 15/03/2027 → 31/03/2027 »). */
    @Column(length = 500)
    private String details;

    @Column(length = 500)
    private String motif;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @Column(name = "date_action", nullable = false, updatable = false)
    private Instant dateAction;

    public HistoriqueMobilite(ObjetHistorique objet, UUID objetId, ActionHistorique action, String details, String motif, Utilisateur auteur) {
        this.objet = objet;
        this.objetId = objetId;
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
