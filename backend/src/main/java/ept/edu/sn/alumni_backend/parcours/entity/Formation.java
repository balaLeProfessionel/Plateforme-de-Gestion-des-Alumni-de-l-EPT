package ept.edu.sn.alumni_backend.parcours.entity;

import java.time.LocalDate;
import java.util.Date;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeFormation;
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
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Formation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String libelle;
    private String description;
    @Enumerated(EnumType.STRING)
    private TypeFormation typeFormation;
    private LocalDate dateDebut;
    private LocalDate dateFin; // null si formation en cours
    private boolean estStage;
    private boolean EstValide;

    @ManyToOne
    @JoinColumn(name = "organisme_id", nullable = false)
    private Organisme organisme;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;
}
