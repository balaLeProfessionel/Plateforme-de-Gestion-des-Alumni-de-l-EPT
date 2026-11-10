package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.repository.ExperienceRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Fiche organisme enrichie : membres passés par l'organisme et événements qu'il organise. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OrganismeFicheIntegrationTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private ExperienceRepository experienceRepository;
    @Autowired private EvenementRepository evenementRepository;
    @Autowired private ParticipationEvenementRepository participationEvenementRepository;
    @Autowired private NotificationRepository notificationRepository;

    private Organisme organisme;
    private Utilisateur contact;
    private Utilisateur lecteur;

    @BeforeEach
    void preparer() {
        participationEvenementRepository.deleteAll();
        evenementRepository.deleteAll();
        notificationRepository.deleteAll();
        experienceRepository.deleteAll();
        utilisateurRepository.deleteAll();

        organisme = new Organisme();
        organisme.setNom("Société Exemple");
        organisme.setTypeOrganisme(TypeOrganisme.ENTREPRISE);
        organisme = organismeRepository.save(organisme);
        contact = membre(null, "Contact", TypeRole.ORGANISME, StatutCompte.ACTIF, true);
        contact.setOrganisme(organisme);
        contact = utilisateurRepository.save(contact);
        lecteur = membre("Lecteur", "Alumni", TypeRole.ALUMNI, StatutCompte.ACTIF, true);
    }

    @Test
    void listeLesMembresVisiblesEnCommencantParCeuxQuiYSontEncore() throws Exception {
        Utilisateur ancienne = membre("Awa", "Diop", TypeRole.ALUMNI, StatutCompte.ACTIF, true);
        experience(ancienne, "Stagiaire", LocalDate.of(2018, 1, 1), LocalDate.of(2018, 6, 30));
        experience(ancienne, "Ingénieure", LocalDate.of(2019, 1, 1), LocalDate.of(2023, 12, 31));
        Utilisateur actuel = membre("Moussa", "Fall", TypeRole.PERSONNEL, StatutCompte.EN_ATTENTE, true);
        experience(actuel, "Directeur technique", LocalDate.of(2020, 3, 1), null);
        experience(membre("Compte", "Suspendu", TypeRole.ALUMNI, StatutCompte.SUSPENDU, true),
            "Analyste", LocalDate.of(2021, 1, 1), null);
        experience(membre("Compte", "Nonverifie", TypeRole.ETUDIANT, StatutCompte.ACTIF, false),
            "Stagiaire", LocalDate.of(2022, 1, 1), null);
        experience(membre("Admin", "EPT", TypeRole.ADMIN, StatutCompte.ACTIF, true),
            "Consultant", LocalDate.of(2015, 1, 1), null);
        ExperienceProfessionelle nonValidee = experience(
            membre("Non", "Validee", TypeRole.ALUMNI, StatutCompte.ACTIF, true), "Inconnu", LocalDate.of(2020, 1, 1), null);
        nonValidee.setEstValide(false);
        experienceRepository.saveAndFlush(nonValidee);

        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.actuels").value(1))
            .andExpect(jsonPath("$.contenu[0].prenom").value("Moussa"))
            .andExpect(jsonPath("$.contenu[0].actuel").value(true))
            .andExpect(jsonPath("$.contenu[0].poste").value("Directeur technique"))
            .andExpect(jsonPath("$.contenu[0].anneeFin").doesNotExist())
            .andExpect(jsonPath("$.contenu[1].prenom").value("Awa"))
            .andExpect(jsonPath("$.contenu[1].poste").value("Ingénieure"))
            .andExpect(jsonPath("$.contenu[1].actuel").value(false))
            .andExpect(jsonPath("$.contenu[1].anneeDebut").value(2018))
            .andExpect(jsonPath("$.contenu[1].anneeFin").value(2023))
            .andExpect(jsonPath("$.contenu[1].email").doesNotExist());

        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()).param("taille", "1").param("page", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu.length()").value(1))
            .andExpect(jsonPath("$.contenu[0].prenom").value("Awa"))
            .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()).param("presence", "ANCIENS"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.actuels").value(1))
            .andExpect(jsonPath("$.anciens").value(1))
            .andExpect(jsonPath("$.contenu.length()").value(1))
            .andExpect(jsonPath("$.contenu[0].prenom").value("Awa"));
        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()).param("presence", "ACTUELS"))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].prenom").value("Moussa"));

        // Recherche sans accents ni casse sur « prénom nom » ; les compteurs suivent la recherche.
        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()).param("recherche", "AWA dió"))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.actuels").value(0))
            .andExpect(jsonPath("$.anciens").value(1))
            .andExpect(jsonPath("$.contenu[0].prenom").value("Awa"));
        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()).param("recherche", "100%"))
            .andExpect(jsonPath("$.totalElements").value(0))
            .andExpect(jsonPath("$.contenu.length()").value(0));
    }

    @Test
    void refuseLaListeDUnOrganismeInvisibleOuInconnuEtUneTailleHorsLimites() throws Exception {
        mockMvc.perform(requete("/api/organisme/{id}/membres", UUID.randomUUID()))
            .andExpect(status().isNotFound());
        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()).param("taille", "49"))
            .andExpect(status().isBadRequest());

        contact.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurRepository.saveAndFlush(contact);
        mockMvc.perform(requete("/api/organisme/{id}/membres", organisme.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    void filtreLesEvenementsOrganisesParLOrganisme() throws Exception {
        evenement(contact, "Forum de recrutement");
        evenement(lecteur, "Rencontre des anciens");

        mockMvc.perform(requete("/api/evenements").param("organisme", organisme.getId().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].titre").value("Forum de recrutement"));
        mockMvc.perform(requete("/api/evenements").param("organisme", UUID.randomUUID().toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    private MockHttpServletRequestBuilder requete(String chemin, Object... args) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(lecteur));
        return get(chemin, args).header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }

    private ExperienceProfessionelle experience(Utilisateur membre, String poste, LocalDate debut, LocalDate fin) {
        ExperienceProfessionelle experience = new ExperienceProfessionelle();
        experience.setPoste(poste);
        experience.setDateDebut(debut);
        experience.setDateFin(fin);
        experience.setEstValide(true);
        experience.setOrganisme(organisme);
        experience.setUtilisateur(membre);
        return experienceRepository.saveAndFlush(experience);
    }

    private void evenement(Utilisateur organisateur, String titre) {
        Instant fin = Instant.now().plus(10, ChronoUnit.DAYS);
        Evenement evenement = new Evenement();
        evenement.setTitre(titre);
        evenement.setDescription("Un événement de test.");
        evenement.setLieu("Dakar");
        evenement.setDateDebut(fin.minus(2, ChronoUnit.HOURS));
        evenement.setDateFin(fin);
        evenement.setAudience(AudienceEvenement.TOUS);
        evenement.setStatut(StatutEvenement.PUBLIE);
        evenement.setOrganisateur(organisateur);
        evenementRepository.saveAndFlush(evenement);
    }

    private Utilisateur membre(String prenom, String nom, TypeRole role, StatutCompte statut, boolean emailVerifie) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail((prenom == null ? role.name() : prenom) + "." + nom + "@example.com");
        utilisateur.setPassword("mot-de-passe-hache");
        utilisateur.setPrenom(prenom);
        utilisateur.setNom(nom);
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(emailVerifie);
        utilisateur.setTelephone("770000000");
        utilisateur.setDateNaissance(LocalDate.of(2000, 1, 1));
        return utilisateurRepository.saveAndFlush(utilisateur);
    }
}
