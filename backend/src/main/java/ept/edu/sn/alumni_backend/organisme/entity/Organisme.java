package ept.edu.sn.alumni_backend.organisme.entity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Organisme {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String nom;
    private String description;
    private String secteurActivite;
    @Enumerated(EnumType.STRING)
    private TypeOrganisme typeOrganisme;
    private String adresse;
    private String telephone;
    private String email;
    private String siteWeb;
    private String logoUrl;
    private String statutJuridique;
    private String trancheEffectif; // ex: "1-10", "11-50", "50-200", "200+"
    private LocalDate dateCreation;
    private String pays;
    private boolean etablissementEpt;
    @Enumerated(EnumType.STRING)
    private StatutCompte statutValidation = StatutCompte.EN_ATTENTE;
    
    @OneToMany(mappedBy = "organisme")
    private List<ExperienceProfessionelle> experiences;
    
    @OneToMany(mappedBy = "organisme")
    private List<Formation> formations;

    @OneToOne(mappedBy = "organisme")
    private Utilisateur contact;
}
