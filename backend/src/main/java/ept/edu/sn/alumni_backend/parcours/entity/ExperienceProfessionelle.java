package ept.edu.sn.alumni_backend.parcours.entity;

import java.time.LocalDate;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class ExperienceProfessionelle {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String poste;
    @Enumerated(EnumType.STRING)
    private TypeContrat typeContrat;
    private LocalDate dateDebut;
    private LocalDate dateFin; // null si poste en cours
    private boolean estStage;
    private boolean estValide; // true à la saisie manuelle, false pour futur scraping

    @ManyToOne
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;
}
