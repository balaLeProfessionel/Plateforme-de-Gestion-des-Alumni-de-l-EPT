package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

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

/** « J'aime » (GAEPT-76), annonces et appels à projets (GAEPT-77, 79), signalements et modération (GAEPT-78). */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PublicationInteractionsIntegrationTests {
    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private PublicationRepository publications;

    @Test
    void unMembreAimeUneSeuleFoisEtPeutRetirerSonJaime() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        Utilisateur lecteur = membre(TypeRole.ETUDIANT);
        Utilisateur autre = membre(TypeRole.ALUMNI);
        Publication cible = publication(auteur, AudiencePublication.TOUS);
        String chemin = "/api/publications/" + cible.getId() + "/jaime";

        mvc.perform(avec(put(chemin), lecteur)).andExpect(status().isOk())
            .andExpect(jsonPath("$.nombre").value(1)).andExpect(jsonPath("$.jaime").value(true));
        // Aimer de nouveau ne compte pas double.
        mvc.perform(avec(put(chemin), lecteur)).andExpect(status().isOk()).andExpect(jsonPath("$.nombre").value(1));
        mvc.perform(avec(put(chemin), autre)).andExpect(status().isOk()).andExpect(jsonPath("$.nombre").value(2));
        mvc.perform(json(post("/api/publications/{id}/commentaires", cible.getId()), autre, "{\"contenu\":\"Bravo\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.auteurRole").value("ALUMNI"));

        mvc.perform(avec(get("/api/publications/{id}", cible.getId()), lecteur)).andExpect(status().isOk())
            .andExpect(jsonPath("$.nombreJaime").value(2)).andExpect(jsonPath("$.jaime").value(true))
            .andExpect(jsonPath("$.nombreCommentaires").value(1))
            .andExpect(jsonPath("$.apercuCommentaire.contenu").value("Bravo"))
            .andExpect(jsonPath("$.apercuCommentaire.auteurRole").value("ALUMNI"));
        mvc.perform(avec(get("/api/publications"), auteur)).andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[?(@.id == '" + cible.getId() + "')].nombreJaime").value(
                org.hamcrest.Matchers.contains(2)))
            .andExpect(jsonPath("$.contenu[?(@.id == '" + cible.getId() + "')].jaime").value(
                org.hamcrest.Matchers.contains(false)))
            .andExpect(jsonPath("$.contenu[?(@.id == '" + cible.getId() + "')].nombreCommentaires").value(
                org.hamcrest.Matchers.contains(1)));

        mvc.perform(avec(delete(chemin), lecteur)).andExpect(status().isOk())
            .andExpect(jsonPath("$.nombre").value(1)).andExpect(jsonPath("$.jaime").value(false));
        // Retirer un « J'aime » absent ne fait rien.
        mvc.perform(avec(delete(chemin), lecteur)).andExpect(status().isOk()).andExpect(jsonPath("$.nombre").value(1));
    }

    @Test
    void onNAimePasUnePublicationQueLOnNePeutPasVoir() throws Exception {
        Utilisateur auteur = membre(TypeRole.PERSONNEL);
        Utilisateur alumni = membre(TypeRole.ALUMNI);
        Publication etudiants = publication(auteur, AudiencePublication.ETUDIANTS);
        mvc.perform(avec(put("/api/publications/{id}/jaime", etudiants.getId()), alumni))
            .andExpect(status().isNotFound());
        mvc.perform(json(post("/api/publications/{id}/signalements", etudiants.getId()), alumni, "{\"motif\":\"SPAM\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void lAdministrationVoitLesPublicationsDeToutesLesAudiences() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        Utilisateur admin = membre(TypeRole.ADMIN);
        Publication alumni = publication(auteur, AudiencePublication.ALUMNI);
        mvc.perform(avec(get("/api/publications/{id}", alumni.getId()), admin)).andExpect(status().isOk());
        mvc.perform(avec(get("/api/publications"), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[?(@.id == '" + alumni.getId() + "')]").exists());
    }

    @Test
    void lAppelAProjetEstReserveALAdministrationEtPorteUneDateLimite() throws Exception {
        Utilisateur alumni = membre(TypeRole.ALUMNI);
        Utilisateur admin = membre(TypeRole.ADMIN);
        String demain = LocalDate.now().plusDays(1).toString();
        String appel = "{\"type\":\"APPEL_PROJET\",\"titre\":\"Fonds d'innovation\",\"audience\":\"TOUS\","
            + "\"contenu\":\"Proposez vos projets\",\"dateLimite\":\"" + demain + "\"}";
        mvc.perform(json(post("/api/publications"), alumni, appel)).andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Seule l'administration peut diffuser un appel à projet."));
        mvc.perform(json(post("/api/publications"), admin, appel)).andExpect(status().isCreated())
            .andExpect(jsonPath("$.type").value("APPEL_PROJET")).andExpect(jsonPath("$.dateLimite").value(demain))
            .andExpect(jsonPath("$.nombreJaime").value(0));

        mvc.perform(json(post("/api/publications"), admin, appel.replace(",\"dateLimite\":\"" + demain + "\"", "")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Indiquez la date limite de réponse."));
        mvc.perform(json(post("/api/publications"), admin, appel.replace(demain, LocalDate.now().minusDays(1).toString())))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("La date limite de réponse est déjà passée."));
        mvc.perform(json(post("/api/publications"), admin, appel.replace("\"titre\":\"Fonds d'innovation\",", "")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Donnez un titre à cette publication."));
        mvc.perform(json(post("/api/publications"), alumni, "{\"type\":\"PUBLICATION\",\"audience\":\"TOUS\","
                + "\"contenu\":\"Bonjour\",\"dateLimite\":\"" + demain + "\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("La date limite ne concerne que les appels à projets."));

        // Filtre par type : la page d'administration ne liste que les publications officielles.
        publication(alumni, AudiencePublication.TOUS);
        mvc.perform(avec(get("/api/publications").param("type", "APPEL_PROJET", "ANNONCE_OFFICIELLE"), admin))
            .andExpect(status().isOk()).andExpect(jsonPath("$.contenu[*].type").value(
                org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.isOneOf("APPEL_PROJET", "ANNONCE_OFFICIELLE"))))
            .andExpect(jsonPath("$.contenu[0].type").value("APPEL_PROJET"));
    }

    @Test
    void unSignalementRemonteALAdministrationQuiMasqueLaPublication() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        Utilisateur premier = membre(TypeRole.ETUDIANT);
        Utilisateur second = membre(TypeRole.ALUMNI);
        Utilisateur admin = membre(TypeRole.ADMIN);
        Publication cible = publication(auteur, AudiencePublication.TOUS);
        String chemin = "/api/publications/" + cible.getId() + "/signalements";

        mvc.perform(json(post(chemin), auteur, "{\"motif\":\"SPAM\"}")).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Vous ne pouvez pas signaler votre propre publication."));
        mvc.perform(json(post(chemin), premier, "{\"motif\":\"AUTRE\",\"detail\":\"  \"}")).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Précisez la raison du signalement."));
        mvc.perform(json(post(chemin), premier, "{\"motif\":\"FAUSSE_INFORMATION\",\"detail\":\" Date erronée \"}"))
            .andExpect(status().isCreated());
        mvc.perform(json(post(chemin), premier, "{\"motif\":\"SPAM\"}")).andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez déjà signalé cette publication."));
        mvc.perform(json(post(chemin), second, "{\"motif\":\"SPAM\"}")).andExpect(status().isCreated());

        // Seule l'administration voit la file, avec le motif et la précision.
        mvc.perform(avec(get("/api/admin/signalements"), premier)).andExpect(status().isForbidden());
        String reponse = mvc.perform(avec(get("/api/admin/signalements"), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[?(@.publication.id == '" + cible.getId() + "')].motif").value(
                org.hamcrest.Matchers.containsInAnyOrder("FAUSSE_INFORMATION", "SPAM")))
            .andExpect(jsonPath("$.contenu[?(@.motif == 'FAUSSE_INFORMATION')].detail").value(
                org.hamcrest.Matchers.hasItem("Date erronée")))
            .andReturn().getResponse().getContentAsString();
        mvc.perform(avec(get("/api/admin/signalements/compteur"), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.enAttente").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        java.util.List<String> ids = com.jayway.jsonpath.JsonPath.read(reponse,
            "$.contenu[?(@.publication.id == '" + cible.getId() + "')].id");

        mvc.perform(avec(patch("/api/admin/signalements/{id}/masquer", ids.get(0)), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PUBLICATION_MASQUEE")).andExpect(jsonPath("$.publication.statut").value("MASQUE"));
        mvc.perform(avec(get("/api/publications/{id}", cible.getId()), second)).andExpect(status().isNotFound());
        // Masquer clôt aussi l'autre signalement : il ne peut plus être traité.
        mvc.perform(avec(patch("/api/admin/signalements/{id}/rejeter", ids.get(1)), admin)).andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce signalement a déjà été traité."));
        mvc.perform(avec(get("/api/admin/signalements").param("traites", "true"), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[?(@.publication.id == '" + cible.getId() + "')].statut").value(
                org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("PUBLICATION_MASQUEE"))));
    }

    @Test
    void rejeterUnSignalementLaisseLaPublicationVisible() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        Utilisateur lecteur = membre(TypeRole.ALUMNI);
        Utilisateur admin = membre(TypeRole.ADMIN);
        Publication cible = publication(auteur, AudiencePublication.TOUS);
        mvc.perform(json(post("/api/publications/{id}/signalements", cible.getId()), lecteur, "{\"motif\":\"HARCELEMENT\"}"))
            .andExpect(status().isCreated());
        String reponse = mvc.perform(avec(get("/api/admin/signalements"), admin))
            .andReturn().getResponse().getContentAsString();
        java.util.List<String> ids = com.jayway.jsonpath.JsonPath.read(reponse,
            "$.contenu[?(@.publication.id == '" + cible.getId() + "')].id");
        mvc.perform(avec(patch("/api/admin/signalements/{id}/rejeter", ids.get(0)), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("REJETE")).andExpect(jsonPath("$.traiteParNom").value(admin.getNom()));
        mvc.perform(avec(get("/api/publications/{id}", cible.getId()), lecteur)).andExpect(status().isOk());
        mvc.perform(avec(patch("/api/admin/signalements/{id}/masquer", UUID.randomUUID()), admin))
            .andExpect(status().isNotFound());
    }

    private Utilisateur membre(TypeRole role) {
        Utilisateur membre = new Utilisateur();
        membre.setEmail("test.interactions." + UUID.randomUUID() + "@example.invalid");
        membre.setPassword("hash-de-test");
        membre.setNom("Test-" + UUID.randomUUID().toString().substring(0, 6));
        membre.setPrenom("Membre");
        membre.setRole(role);
        membre.setStatutCompte(StatutCompte.ACTIF);
        membre.setEmailVerifie(true);
        return utilisateurs.saveAndFlush(membre);
    }

    private MockHttpServletRequestBuilder avec(MockHttpServletRequestBuilder requete, Utilisateur membre) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwt.genererToken(new UtilisateurPrincipal(membre)));
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder requete, Utilisateur membre, String corps) {
        return avec(requete, membre).contentType(MediaType.APPLICATION_JSON).content(corps);
    }

    private Publication publication(Utilisateur auteur, AudiencePublication audience) {
        Publication publication = new Publication();
        publication.setAuteur(auteur);
        publication.setType(TypePublication.PUBLICATION);
        publication.setContenu("Contenu de test");
        publication.setAudience(audience);
        publication.setStatut(StatutPublication.PUBLIE);
        return publications.saveAndFlush(publication);
    }
}
