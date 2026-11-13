package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.AudiencePublication;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.repository.PublicationRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Fil personnalisé : classement par affinité, audience respectée, raison affichée, pagination figée. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FilApiIntegrationTests {
    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private PublicationRepository publications;

    @Test
    void lesPublicationsDeSaPromotionPassentDevantEtLAudienceEstRespectee() throws Exception {
        Utilisateur lecteur = membre(TypeRole.ETUDIANT, 2020, "Génie informatique");
        Utilisateur camarade = membre(TypeRole.ALUMNI, 2020, "Génie informatique");
        Utilisateur inconnu = membre(TypeRole.ALUMNI, 2011, "Génie civil");
        // L'inconnu publie après la camarade : seul l'ordre chronologique le mettrait devant.
        Publication deLaCamarade = publication(camarade, AudiencePublication.TOUS, "Offre de stage chez nous");
        Publication deLInconnu = publication(inconnu, AudiencePublication.TOUS, "Bonjour à tous");
        Publication reservee = publication(inconnu, AudiencePublication.ALUMNI, "Réservé aux alumni");

        String corps = mvc.perform(avec(get("/api/fil").param("taille", "30"), lecteur))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reference").exists())
            .andReturn().getResponse().getContentAsString();

        List<String> ids = JsonPath.read(corps, "$.contenu[?(@.type == 'PUBLICATION')].publication.id");
        assertThat(ids).contains(deLaCamarade.getId().toString(), deLInconnu.getId().toString())
            .doesNotContain(reservee.getId().toString());
        assertThat(ids.indexOf(deLaCamarade.getId().toString())).isLessThan(ids.indexOf(deLInconnu.getId().toString()));
        List<String> raisons = JsonPath.read(corps, "$.contenu[?(@.publication.id == '" + deLaCamarade.getId() + "')].raison");
        assertThat(raisons).containsExactly("De votre promotion 2020");
    }

    @Test
    void lesPagesSuivantesGardentLeMemeClassementGraceALaReference() throws Exception {
        Utilisateur lecteur = membre(TypeRole.ALUMNI, 2018, null);
        Utilisateur auteur = membre(TypeRole.ALUMNI, 2010, null);
        for (int i = 0; i < 4; i++) publication(auteur, AudiencePublication.TOUS, "Publication " + i);

        String premiere = mvc.perform(avec(get("/api/fil").param("taille", "2"), lecteur))
            .andExpect(status().isOk()).andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.derniere").value(false))
            .andReturn().getResponse().getContentAsString();
        String reference = JsonPath.read(premiere, "$.reference");
        // Une publication parue après le premier chargement n'apparaît pas dans la suite du même fil.
        Publication tardive = publication(auteur, AudiencePublication.TOUS, "Parue entre deux pages");
        String suite = mvc.perform(avec(get("/api/fil").param("taille", "30").param("page", "0").param("reference", reference), lecteur))
            .andExpect(status().isOk()).andExpect(jsonPath("$.reference").value(reference))
            .andReturn().getResponse().getContentAsString();
        List<String> ids = JsonPath.read(suite, "$.contenu[*].publication.id");
        assertThat(ids).doesNotContain(tardive.getId().toString());
    }

    @Test
    void leFilExigeUneConnexion() throws Exception {
        mvc.perform(get("/api/fil")).andExpect(status().isForbidden());
    }

    private Utilisateur membre(TypeRole role, Integer promotion, String filiere) {
        Utilisateur membre = new Utilisateur();
        membre.setEmail("test.fil." + UUID.randomUUID() + "@example.invalid");
        membre.setPassword("hash-de-test");
        membre.setNom("Test-" + UUID.randomUUID().toString().substring(0, 6));
        membre.setPrenom("Membre");
        membre.setRole(role);
        membre.setStatutCompte(StatutCompte.ACTIF);
        membre.setEmailVerifie(true);
        membre.setAnneeSortie(promotion);
        membre.setFiliere(filiere);
        return utilisateurs.saveAndFlush(membre);
    }

    private MockHttpServletRequestBuilder avec(MockHttpServletRequestBuilder requete, Utilisateur membre) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt.genererToken(new UtilisateurPrincipal(membre)));
    }

    private Publication publication(Utilisateur auteur, AudiencePublication audience, String contenu) throws InterruptedException {
        Thread.sleep(5);
        Publication publication = new Publication();
        publication.setAuteur(auteur);
        publication.setType(TypePublication.PUBLICATION);
        publication.setContenu(contenu);
        publication.setAudience(audience);
        publication.setStatut(StatutPublication.PUBLIE);
        return publications.saveAndFlush(publication);
    }
}
