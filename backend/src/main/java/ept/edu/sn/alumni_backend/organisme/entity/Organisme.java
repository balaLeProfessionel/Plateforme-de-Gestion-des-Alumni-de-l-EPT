package ept.edu.sn.alumni_backend.organisme.entity;

import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;

@Entity
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
    private String dateCreation;
    private String pays;

    @OneToMany(mappedBy = "organisme")
    private List<ExperienceProfessionelle> experiences;
    
    @OneToMany(mappedBy = "organisme")
    private List<Formation> formations;
}
