package ept.edu.sn.alumni_backend.parcours.entity;

import java.util.Date;
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
    private Date dateDebut;
    private Date dateFin;
    private boolean estStage;
    private boolean enCours;
    private boolean estValide;

    @ManyToOne
    @JoinColumn(name = "organisme_id")
    private Organisme organisme;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;
}
