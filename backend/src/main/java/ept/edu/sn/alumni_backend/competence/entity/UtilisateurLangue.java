package ept.edu.sn.alumni_backend.competence.entity;

import java.io.Serializable;
import java.util.UUID;

import ept.edu.sn.alumni_backend.competence.NiveauLangue;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Langue parlée par un membre. Code ISO 639 : deux lettres, ou trois pour le sérère, le diola… */
@Entity
@Table(name = "utilisateur_langues")
@Getter
@Setter
public class UtilisateurLangue {

    @Embeddable
    public record Id(
        @Column(name = "utilisateur_id") UUID utilisateurId,
        @Column(name = "code_langue", length = 3) String codeLangue
    ) implements Serializable {}

    @EmbeddedId
    private Id id;

    @MapsId("utilisateurId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", foreignKey = @ForeignKey(name = "fk_utilisateur_langues_utilisateur"))
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NiveauLangue niveau;
}
