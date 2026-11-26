package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import ept.edu.sn.alumni_backend.competence.repository.CompetenceRepository;
import ept.edu.sn.alumni_backend.competence.repository.UtilisateurCompetenceRepository;
import ept.edu.sn.alumni_backend.competence.repository.UtilisateurLangueRepository;
import ept.edu.sn.alumni_backend.competence.service.CompetencesLanguesService;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import org.springframework.transaction.support.TransactionTemplate;

/** Compétences (référentiel commun) et langues d'un membre ; situation et pays dans le profil. */
@SpringBootTest
@AutoConfigureMockMvc
class CompetencesLanguesIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private CompetenceRepository competences;
    @Autowired private UtilisateurCompetenceRepository competencesMembres;
    @Autowired private UtilisateurLangueRepository languesMembres;
    @Autowired private TransactionTemplate transaction;

    private final List<Utilisateur> crees = new ArrayList<>();

    @AfterEach
    void nettoyer() {
        transaction.executeWithoutResult(s -> crees.forEach(u -> {
            competencesMembres.supprimerPour(u.getId());
            languesMembres.supprimerPour(u.getId());
        }));
        crees.forEach(u -> utilisateurs.deleteById(u.getId()));
        competences.deleteAll(competences.findByCleIn(List.of("java", "spring boot", "c++", "c#", "gestion de projet")));
    }

    @Test
    void leMembreRemplaceSesCompetencesEtLanguesDansLOrdreChoisi() throws Exception {
        Utilisateur membre = membre();
        mockMvc.perform(put("/api/profil/me/competences-langues")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"competences": ["Spring Boot", "Java", "spring-boot", "C++", "C#"],
                     "langues": [{"code": "fr", "niveau": "COURANT"}, {"code": "wo", "niveau": "MATERNELLE"},
                                 {"code": "srr", "niveau": "NOTIONS"}, {"code": "fr", "niveau": "NOTIONS"}]}
                    """))
            .andExpect(status().isOk())
            // Doublon fusionné, ordre conservé, C++ et C# restent distincts
            .andExpect(jsonPath("$.competences").value(org.hamcrest.Matchers.contains("Spring Boot", "Java", "C++", "C#")))
            // Langue maternelle en tête ; un doublon de langue garde la première saisie
            .andExpect(jsonPath("$.langues.length()").value(3))
            .andExpect(jsonPath("$.langues[0].code").value("wo"))
            .andExpect(jsonPath("$.langues[1].code").value("fr"))
            .andExpect(jsonPath("$.langues[1].niveau").value("COURANT"));

        // Un second membre réutilise la compétence existante au lieu d'en créer une autre
        Utilisateur autre = membre();
        mockMvc.perform(put("/api/profil/me/competences-langues")
                .header(HttpHeaders.AUTHORIZATION, jeton(autre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"competences\": [\"JAVA\"], \"langues\": []}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.competences[0]").value("Java"));
        assertThat(competences.findByCleIn(List.of("java"))).hasSize(1);

        mockMvc.perform(get("/api/competences").param("q", "spr").header(HttpHeaders.AUTHORIZATION, jeton(autre)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].libelle").value("Spring Boot"));

        // Remplacement complet : la liste vide efface
        mockMvc.perform(put("/api/profil/me/competences-langues")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"competences\": [], \"langues\": []}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.competences.length()").value(0))
            .andExpect(jsonPath("$.langues.length()").value(0));
    }

    @Test
    void uneLangueInconnueOuUnNiveauManquantSontRefuses() throws Exception {
        Utilisateur membre = membre();
        mockMvc.perform(put("/api/profil/me/competences-langues")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"competences\": [], \"langues\": [{\"code\": \"zz\", \"niveau\": \"COURANT\"}]}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Langue inconnue : zz"));

        mockMvc.perform(put("/api/profil/me/competences-langues")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"competences\": [], \"langues\": [{\"code\": \"fr\"}]}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void leProfilPublicMontreCompetencesLanguesSituationEtPays() throws Exception {
        Utilisateur membre = membre();
        mockMvc.perform(patch("/api/profil/me")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\": \"Diop\", \"prenom\": \"Awa\", \"situationActuelle\": \"EN_POSTE\", \"paysResidence\": \"SN\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.situationActuelle").value("EN_POSTE"))
            .andExpect(jsonPath("$.paysResidence").value("SN"));
        mockMvc.perform(put("/api/profil/me/competences-langues")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"competences\": [\"Gestion de projet\"], \"langues\": [{\"code\": \"en\", \"niveau\": \"COURANT\"}]}"))
            .andExpect(status().isOk());

        Utilisateur lecteur = membre();
        mockMvc.perform(get("/api/profil/{id}", membre.getId()).header(HttpHeaders.AUTHORIZATION, jeton(lecteur)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.competences[0]").value("Gestion de projet"))
            .andExpect(jsonPath("$.langues[0].code").value("en"))
            .andExpect(jsonPath("$.situationActuelle").value("EN_POSTE"))
            .andExpect(jsonPath("$.paysResidence").value("SN"));

        // Chaîne vide : efface ; valeur inconnue : refusée
        mockMvc.perform(patch("/api/profil/me")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\": \"Diop\", \"prenom\": \"Awa\", \"situationActuelle\": \"\", \"paysResidence\": \"\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.situationActuelle").doesNotExist())
            .andExpect(jsonPath("$.paysResidence").doesNotExist());
        mockMvc.perform(patch("/api/profil/me")
                .header(HttpHeaders.AUTHORIZATION, jeton(membre))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\": \"Diop\", \"prenom\": \"Awa\", \"paysResidence\": \"Senegal\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void laCleDeCompetenceIgnoreAccentsCasseEtPonctuation() {
        assertThat(CompetencesLanguesService.cle("  Développement  Web ")).isEqualTo("developpement web");
        assertThat(CompetencesLanguesService.cle("Spring-Boot")).isEqualTo("spring boot");
        assertThat(CompetencesLanguesService.cle("C++")).isNotEqualTo(CompetencesLanguesService.cle("C#"));
    }

    private Utilisateur membre() {
        Utilisateur u = new Utilisateur();
        u.setEmail("competences." + UUID.randomUUID() + "@example.invalid");
        u.setPassword("hash-de-test");
        u.setPrenom("Awa");
        u.setNom("Diop");
        u.setRole(TypeRole.ALUMNI);
        u.setStatutCompte(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        Utilisateur enregistre = utilisateurs.saveAndFlush(u);
        crees.add(enregistre);
        return enregistre;
    }

    private String jeton(Utilisateur u) {
        return "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(u));
    }
}
