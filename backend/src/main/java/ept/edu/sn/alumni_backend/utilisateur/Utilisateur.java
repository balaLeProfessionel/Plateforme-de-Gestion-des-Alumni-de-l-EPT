package ept.edu.sn.alumni_backend.utilisateur;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.entity.PermissionAdminConverter;
import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeDiplome;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Convert;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Utilisateur {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password;

    private String prenom;
    private String nom;
    @Column(length = 1000)
    private String bio;
    private String villeResidence;
    private String posteActuel;
    private String lienLinkedin;
    private String lienPortfolio;
    private String urlPhoto;
    @Enumerated(EnumType.STRING)
    private TypeRole role;
    @Enumerated(EnumType.STRING)
    private StatutCompte statutCompte;
    @Column(nullable = false)
    private boolean emailVerifie = false;
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean doitChangerMotDePasse = false;
    /** Le diplômé peut se retirer de la recherche accessible sans compte. */
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean recherchePublique = true;

    /** Identifiant permanent du compte Google lié (« sub » du jeton), indépendant de son adresse. */
    @Column(unique = true)
    private String googleSub;
    /** Adresse du compte Google lié, pour l'afficher dans les paramètres. */
    private String googleEmail;
    /**
     * Faux après un déliement : Google ne rouvre plus ce compte par son adresse, seulement par une
     * liaison faite depuis les paramètres.
     */
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean connexionGoogleParAdresse = true;
    /**
     * Faux quand le mot de passe est aléatoire (compte créé ou repris avec Google) : la personne ne le
     * connaît pas, et délier Google lui fermerait son compte.
     */
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean motDePasseDefini = true;
    private LocalDate dateNaissance;
    private String telephone;
    private Integer anneeEntree;
    private Integer anneeSortie;
    @Enumerated(EnumType.STRING)
    private TypeDiplome diplome;
    /** Filière de l'école (TRA-14) ; vide pour un organisme, un visiteur ou le personnel. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "filiere_id", foreignKey = @ForeignKey(name = "fk_utilisateur_filiere"))
    private Filiere filiere;

    /** Classe de l'année en cours, pour un étudiant seulement (TC1… DIC3, Master, Doctorat). */
    @Enumerated(EnumType.STRING)
    @Column(length = 12)
    private Classe classe;

    /** Situation déclarée par un alumni (en poste, en recherche…) ; facultative. */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SituationActuelle situationActuelle;

    /** Pays de résidence, code ISO 3166-1 alpha-2 (SN, FR…) ; complète la ville. */
    @Column(length = 2)
    private String paysResidence;

    private LocalDateTime dateCreation;

    @OneToMany(mappedBy = "utilisateur")
    private List<Formation> formations = new ArrayList<>();
    
    @OneToMany(mappedBy = "utilisateur")
    private List<ExperienceProfessionelle> experiences = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organisme_id", unique = true)
    private Organisme organisme; // uniquement si role = ORGANISME

    /**
     * Responsabilités d'un compte d'administration, cochées par un super administrateur (vide hors administration).
     * Lire les permissions effectives avec PermissionAdmin.pour(utilisateur).
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "utilisateur_permission_admin", joinColumns = @JoinColumn(name = "utilisateur_id"))
    @Convert(converter = PermissionAdminConverter.class)
    @Column(name = "permission", nullable = false, length = 40)
    @BatchSize(size = 50)
    private Set<PermissionAdmin> permissionsAdmin = new HashSet<>();

    @PrePersist
    public void onCreate() {
        this.dateCreation = LocalDateTime.now();
    }

    /** Nom de la filière, ou null : ce que montrent les réponses de l'API. */
    public String getNomFiliere() {
        return filiere == null ? null : filiere.getNom();
    }
}
