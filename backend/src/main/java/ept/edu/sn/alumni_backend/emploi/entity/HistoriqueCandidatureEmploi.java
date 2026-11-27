package ept.edu.sn.alumni_backend.emploi.entity;

import ept.edu.sn.alumni_backend.emploi.StatutCandidatureEmploi;
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
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Un changement de statut d'une candidature (#223) : envoi, retrait, décision du recruteur ou clôture de l'offre. Sert au
 * suivi par le recruteur et, plus tard, aux statistiques d'insertion.
 */
@Entity
@Table(name = "historique_candidature_emploi",
    indexes = @Index(name = "ix_historique_candidature_emploi_candidature", columnList = "candidature_id, change_le"))
@Getter
@NoArgsConstructor
public class HistoriqueCandidatureEmploi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidature_id", nullable = false)
    private CandidatureEmploi candidature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutCandidatureEmploi statut;

    /** Qui a fait le changement : le candidat, un compte de l'organisme ou un administrateur. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    private Utilisateur auteur;

    @Column(name = "change_le", nullable = false)
    private Instant changeLe;

    public HistoriqueCandidatureEmploi(CandidatureEmploi candidature, StatutCandidatureEmploi statut, Utilisateur auteur, Instant changeLe) {
        this.candidature = candidature;
        this.statut = statut;
        this.auteur = auteur;
        this.changeLe = changeLe;
    }
}
