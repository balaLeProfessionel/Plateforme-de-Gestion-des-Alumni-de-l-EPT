package ept.edu.sn.alumni_backend.mentorat.entity;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.mentorat.StatutMentorat;
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
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

/** Une demande de mentorat et tout son cycle de vie, de l'envoi à la clôture. */
@Entity
@Table(name = "mentorats", indexes = {
    @Index(name = "ix_mentorat_mentor_statut", columnList = "profil_mentor_id, statut"),
    @Index(name = "ix_mentorat_mentore_statut", columnList = "mentore_id, statut")
})
@Getter
@Setter
public class Mentorat {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentore_id", nullable = false)
    private Utilisateur mentore;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profil_mentor_id", nullable = false)
    private ProfilMentor profilMentor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "domaine_id", nullable = false)
    private DomaineMentorat domaine;

    /** Facultatif : un mentorat libre n'appartient à aucun programme. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "programme_id")
    private ProgrammeMentorat programme;

    @Column(nullable = false, length = 1000)
    private String objectif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutMentorat statut = StatutMentorat.EN_ATTENTE;

    @Column(length = 500)
    private String motifRefus;

    /** Annulation décidée par la plateforme (le mentor a quitté le programme) : la phrase montrée aux deux. */
    @Column(length = 500)
    private String motifAnnulation;

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    private Instant reponduLe;

    private Instant clotureLe;

    @Version
    private long version;

    @PrePersist
    void initialiserDate() {
        creeLe = Instant.now();
    }
}
