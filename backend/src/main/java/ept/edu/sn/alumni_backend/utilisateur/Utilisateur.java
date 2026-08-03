package ept.edu.sn.alumni_backend.utilisateur;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeDiplome;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import lombok.Data;

@Entity
@Data
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private TypeRole role;
    @Enumerated(EnumType.STRING)
    private StatutCompte statutCompte;
    @Column(nullable = false)
    private boolean emailVerifie = false;
    private String prenom;
    private String nom;
    private String urlPhoto;
    private LocalDate dateNaissance;
    private String telephone;
    private Integer anneeEntree;
    @Enumerated(EnumType.STRING)
    private TypeDiplome diplome;
    private String filiere;
    
    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "utilisateur")
    private List<Formation> formations = new ArrayList<>();
    
    @OneToMany(mappedBy = "utilisateur")
    private List<ExperienceProfessionelle> experiences = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }
}
