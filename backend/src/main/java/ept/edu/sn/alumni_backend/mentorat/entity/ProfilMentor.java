package ept.edu.sn.alumni_backend.mentorat.entity;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Check;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Offre de mentorat d'un alumni. Le profil n'est jamais supprimé : on le rend indisponible,
 * pour que les mentorats passés gardent leur mentor.
 */
@Entity
@Table(name = "profils_mentor")
@Check(name = "ck_profil_mentor_capacite", constraints = "capacite_max between 1 and 10")
@Getter
@Setter
public class ProfilMentor {
    public static final int CAPACITE_PAR_DEFAUT = 3;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id", nullable = false, unique = true)
    private Utilisateur utilisateur;

    @Column(length = 600)
    private String presentation;

    @Column(nullable = false)
    private boolean disponible = true;

    @Column(name = "capacite_max", nullable = false)
    private int capaciteMax = CAPACITE_PAR_DEFAUT;

    /** Chargés par lots : une page de mentors ne déclenche qu'une requête pour tous leurs domaines. */
    @ManyToMany
    @BatchSize(size = 50)
    @JoinTable(
        name = "profil_mentor_domaines",
        joinColumns = @JoinColumn(name = "profil_mentor_id"),
        inverseJoinColumns = @JoinColumn(name = "domaine_id"))
    private Set<DomaineMentorat> domaines = new LinkedHashSet<>();

    @Column(nullable = false, updatable = false)
    private Instant creeLe;

    @Column(nullable = false)
    private Instant modifieLe;

    /**
     * Mentor visible et sollicitable : alumni au compte actif et vérifié. Une offre d'un compte
     * suspendu ou en attente reste en base mais n'apparaît nulle part.
     */
    public boolean estSollicitable() {
        return utilisateur.isEmailVerifie()
            && utilisateur.getStatutCompte() == StatutCompte.ACTIF
            && utilisateur.getRole() == TypeRole.ALUMNI;
    }

    @PrePersist
    void initialiserDates() {
        creeLe = Instant.now();
        modifieLe = creeLe;
    }

    @PreUpdate
    void mettreAJourDateModification() {
        modifieLe = Instant.now();
    }
}
