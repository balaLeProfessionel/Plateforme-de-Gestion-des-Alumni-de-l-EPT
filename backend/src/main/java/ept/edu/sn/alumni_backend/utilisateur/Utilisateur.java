package ept.edu.sn.alumni_backend.utilisateur;

import java.util.Date;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.TypeDiplome;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Data;

@Entity
@Data
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    private TypeRole role;
    private String prenom;
    private String nom;
    private String email;
    private String password;
    private String urlPhoto;
    private Date dateNaissance;
    private String telephone;
    private int anneeEntree;
    @Enumerated(EnumType.STRING)
    private TypeDiplome diplome;
    private String filiere;

    @OneToMany(mappedBy = "utilisateur")
    private List<Formation> formations;
    
    @OneToMany(mappedBy = "utilisateur")
    private List<ExperienceProfessionelle> experiences;
}
