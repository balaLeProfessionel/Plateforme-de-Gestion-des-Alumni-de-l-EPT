package ept.edu.sn.alumni_backend.emploi.entity;

import ept.edu.sn.alumni_backend.emploi.MotifSignalementOffre;
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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Signalement d'une offre par un membre (lien mort, arnaque…) : un seul par membre et par offre. */
@Entity
@Table(name = "signalement_offre_emploi",
    uniqueConstraints = @UniqueConstraint(name = "uk_signalement_offre_emploi_auteur", columnNames = {"offre_id", "auteur_id"}))
@Getter
@Setter
@NoArgsConstructor
public class SignalementOffreEmploi {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private OffreEmploi offre;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "auteur_id", nullable = false)
    private Utilisateur auteur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MotifSignalementOffre motif;

    @Column(length = 500)
    private String commentaire;

    @Column(name = "cree_le", nullable = false, updatable = false)
    private Instant creeLe;

    /** Date à laquelle l'administration a traité le signalement (classé, ou offre retirée) ; null tant qu'il attend (#224). */
    @Column(name = "traite_le")
    private Instant traiteLe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "traite_par_id")
    private Utilisateur traitePar;

    public void traiter(Utilisateur admin, Instant quand) {
        traitePar = admin;
        traiteLe = quand;
    }

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
    }
}
