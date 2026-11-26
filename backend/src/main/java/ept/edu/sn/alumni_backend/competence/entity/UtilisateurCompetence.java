package ept.edu.sn.alumni_backend.competence.entity;

import java.io.Serializable;
import java.util.UUID;

import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Compétence citée par un membre, dans l'ordre qu'il a choisi. */
@Entity
@Table(name = "utilisateur_competences")
@Getter
@Setter
public class UtilisateurCompetence {

    @Embeddable
    public record Id(
        @Column(name = "utilisateur_id") UUID utilisateurId,
        @Column(name = "competence_id") UUID competenceId
    ) implements Serializable {}

    @EmbeddedId
    private Id id;

    @MapsId("utilisateurId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", foreignKey = @ForeignKey(name = "fk_utilisateur_competences_utilisateur"))
    private Utilisateur utilisateur;

    @MapsId("competenceId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "competence_id", foreignKey = @ForeignKey(name = "fk_utilisateur_competences_competence"))
    private Competence competence;

    @Column(nullable = false)
    private short ordre;
}
