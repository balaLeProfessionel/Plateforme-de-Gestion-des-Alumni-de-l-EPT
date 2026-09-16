package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeContrat;
import ept.edu.sn.alumni_backend.enums.TypeFormation;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.parcours.entity.ExperienceProfessionelle;
import ept.edu.sn.alumni_backend.parcours.entity.Formation;
import ept.edu.sn.alumni_backend.parcours.repository.ExperienceRepository;
import ept.edu.sn.alumni_backend.parcours.repository.FormationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ProfilPublicIntegrationTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private OrganismeRepository organismeRepository;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private FormationRepository formationRepository;

    @BeforeEach
    void nettoyer() {
        experienceRepository.deleteAll();
        formationRepository.deleteAll();
        organismeRepository.deleteAll();
        utilisateurRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = "ALUMNI")
    void retourneLeProfilEtLeParcoursSansCoordonneesPrivees() throws Exception {
        Utilisateur membre = membreVisible();
        Organisme organisme = new Organisme();
        organisme.setNom("École Polytechnique de Thiès (EPT)");
        organisme.setEtablissementEpt(true);
        organisme = organismeRepository.save(organisme);

        ExperienceProfessionelle experience = new ExperienceProfessionelle();
        experience.setPoste("Ingénieur logiciel");
        experience.setDescription("Conception et mise en production de services numériques.");
        experience.setTypeContrat(TypeContrat.CDI);
        experience.setDateDebut(LocalDate.of(2024, 1, 1));
        experience.setUtilisateur(membre);
        experience.setOrganisme(organisme);
        experienceRepository.save(experience);

        Formation formation = new Formation();
        formation.setLibelle("Diplôme d'ingénieur");
        formation.setTypeFormation(TypeFormation.DIPLOMANTE);
        formation.setDateDebut(LocalDate.of(2021, 10, 1));
        formation.setDateFin(LocalDate.of(2024, 7, 1));
        formation.setUtilisateur(membre);
        formation.setOrganisme(organisme);
        formationRepository.save(formation);

        mockMvc.perform(get("/api/profil/{id}", membre.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.prenom").value("Ibrahima"))
            .andExpect(jsonPath("$.experiences[0].poste").value("Ingénieur logiciel"))
            .andExpect(jsonPath("$.experiences[0].description").value(
                "Conception et mise en production de services numériques."))
            .andExpect(jsonPath("$.experiences[0].etablissementEpt").value(true))
            .andExpect(jsonPath("$.formations[0].libelle").value("Diplôme d'ingénieur"))
            .andExpect(jsonPath("$.formations[0].etablissementEpt").value(true))
            .andExpect(jsonPath("$.email").doesNotExist())
            .andExpect(jsonPath("$.telephone").doesNotExist())
            .andExpect(jsonPath("$.dateNaissance").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "ALUMNI")
    void masqueUnProfilSuspendu() throws Exception {
        Utilisateur membre = membreVisible();
        membre.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurRepository.save(membre);

        mockMvc.perform(get("/api/profil/{id}", membre.getId()))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Ce profil n'est pas disponible"));
    }

    @Test
    void refuseLaConsultationSansAuthentification() throws Exception {
        Utilisateur membre = membreVisible();

        mockMvc.perform(get("/api/profil/{id}", membre.getId()))
            .andExpect(status().isForbidden());
    }

    private Utilisateur membreVisible() {
        Utilisateur membre = new Utilisateur();
        membre.setEmail("ibrahima.sow@example.com");
        membre.setPassword("mot-de-passe-hache");
        membre.setPrenom("Ibrahima");
        membre.setNom("Sow");
        membre.setRole(TypeRole.ALUMNI);
        membre.setStatutCompte(StatutCompte.ACTIF);
        membre.setEmailVerifie(true);
        membre.setBio("Ingénieur logiciel diplômé de l'EPT.");
        membre.setTelephone("770000000");
        membre.setDateNaissance(LocalDate.of(2000, 1, 1));
        membre.setVilleResidence("Thiès");
        membre.setFiliere("Génie Informatique et Télécommunications");
        membre.setAnneeSortie(2024);
        return utilisateurRepository.save(membre);
    }
}
