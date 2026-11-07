package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.publication.StatutPublication;
import ept.edu.sn.alumni_backend.publication.TypePublication;
import ept.edu.sn.alumni_backend.publication.entity.Publication;
import ept.edu.sn.alumni_backend.publication.repository.PublicationRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ArticleIntegrationTests {
    private static final String CORPS = "## Mon parcours\n\nDe Thiès à Dakar, dix ans de réseaux électriques.";

    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private PublicationRepository publications;

    @Test
    void unBrouillonNestVuQueParSonAuteur() throws Exception {
        Utilisateur auteur = membre(TypeRole.ETUDIANT);
        Utilisateur autre = membre(TypeRole.ALUMNI);
        String id = creer(auteur, "Brouillon secret", "Un résumé", CORPS, "TOUS");
        mvc.perform(get("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("BROUILLON"))
            .andExpect(jsonPath("$.estAuteur").value(true)).andExpect(jsonPath("$.publicationId").doesNotExist());
        mvc.perform(get("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(autre)))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Cet article n'est pas disponible."));
        mvc.perform(get("/api/articles").param("recherche", "Brouillon secret").header(HttpHeaders.AUTHORIZATION, jeton(autre)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/articles/miens").header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.contenu[0].titre").value("Brouillon secret"));
        mvc.perform(put("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(autre))
            .contentType(MediaType.APPLICATION_JSON).content(corps("Pris", "r", CORPS, "TOUS")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/articles")).andExpect(status().isForbidden());
    }

    @Test
    void publierExigeResumeEtCorpsPuisCreeLaPublicationPorteuse() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        String vide = creer(auteur, "Sans corps", null, "", "TOUS");
        mvc.perform(patch("/api/articles/{id}/publier", vide).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Ajoutez un résumé avant de publier."));

        String id = creer(auteur, "De Thiès à Montréal", "Dix ans dans l'énergie", CORPS, "TOUS");
        String reponse = mvc.perform(patch("/api/articles/{id}/publier", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("PUBLIE"))
            .andExpect(jsonPath("$.publieLe").exists()).andReturn().getResponse().getContentAsString();
        String publicationId = JsonPath.read(reponse, "$.publicationId");
        Publication porteuse = publications.findById(UUID.fromString(publicationId)).orElseThrow();
        assertEquals(TypePublication.ARTICLE, porteuse.getType());
        assertEquals("De Thiès à Montréal", porteuse.getTitre());
        assertEquals("Dix ans dans l'énergie", porteuse.getContenu());

        mvc.perform(get("/api/publications/{id}", publicationId).header(HttpHeaders.AUTHORIZATION, jeton(membre(TypeRole.ETUDIANT))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.type").value("ARTICLE"))
            .andExpect(jsonPath("$.article.id").value(id)).andExpect(jsonPath("$.article.theme").value("PARCOURS"));
        mvc.perform(patch("/api/articles/{id}/publier", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("Cet article est déjà publié."));
    }

    @Test
    void laBibliothequeRespecteAudienceThemeEtRecherche() throws Exception {
        Utilisateur auteur = membre(TypeRole.PERSONNEL);
        String mot = "Microgrid" + UUID.randomUUID().toString().substring(0, 6);
        String pourEtudiants = publier(auteur, mot + " pour les étudiants", "ETUDIANTS");
        publier(auteur, mot + " pour tous", "TOUS");
        Utilisateur etudiant = membre(TypeRole.ETUDIANT);
        Utilisateur alumni = membre(TypeRole.ALUMNI);
        mvc.perform(get("/api/articles").param("recherche", mot.toLowerCase()).header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/articles").param("recherche", mot).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.contenu[0].titre").value(mot + " pour tous"))
            .andExpect(jsonPath("$.contenu[0].contenu").doesNotExist());
        mvc.perform(get("/api/articles/{id}", pourEtudiants).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/articles").param("recherche", mot).param("theme", "CARRIERE")
            .header(HttpHeaders.AUTHORIZATION, jeton(etudiant))).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/articles").param("recherche", mot).param("theme", "PARCOURS")
            .header(HttpHeaders.AUTHORIZATION, jeton(etudiant))).andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void lesJaimeDeLaPublicationPorteuseRemontentSurLArticle() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        Utilisateur lecteur = membre(TypeRole.ETUDIANT);
        String id = publier(auteur, "Article apprécié", "TOUS");
        String publicationId = JsonPath.read(mvc.perform(get("/api/articles/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, jeton(lecteur))).andReturn().getResponse().getContentAsString(), "$.publicationId");
        mvc.perform(put("/api/publications/{id}/jaime", publicationId).header(HttpHeaders.AUTHORIZATION, jeton(lecteur)))
            .andExpect(status().isOk());
        mvc.perform(post("/api/publications/{id}/commentaires", publicationId).header(HttpHeaders.AUTHORIZATION, jeton(lecteur))
            .contentType(MediaType.APPLICATION_JSON).content("{\"contenu\":\"Merci pour ce retour\"}")).andExpect(status().isCreated());
        mvc.perform(get("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(lecteur)))
            .andExpect(jsonPath("$.nombreJaime").value(1)).andExpect(jsonPath("$.jaime").value(true))
            .andExpect(jsonPath("$.nombreCommentaires").value(1)).andExpect(jsonPath("$.estAuteur").value(false));
    }

    @Test
    void modifierUnArticlePublieMetAJourSaCarteEtSonTempsDeLecture() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        String id = publier(auteur, "Titre initial", "TOUS");
        String long_ = "mot ".repeat(450);
        String reponse = mvc.perform(put("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur))
            .contentType(MediaType.APPLICATION_JSON).content(corps("Titre revu", "Résumé revu", long_, "ALUMNI")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tempsLecture").value(3))
            .andReturn().getResponse().getContentAsString();
        Publication porteuse = publications.findById(UUID.fromString(JsonPath.read(reponse, "$.publicationId"))).orElseThrow();
        assertEquals("Titre revu", porteuse.getTitre());
        assertEquals("Résumé revu", porteuse.getContenu());
        assertEquals("ALUMNI", porteuse.getAudience().name());
        mvc.perform(put("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur))
            .contentType(MediaType.APPLICATION_JSON).content(corps("Titre revu", "", long_, "ALUMNI")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void masquerLaPublicationPorteuseMasqueLArticleSaufPourSonAuteur() throws Exception {
        Utilisateur auteur = membre(TypeRole.ETUDIANT);
        Utilisateur lecteur = membre(TypeRole.ALUMNI);
        String id = publier(auteur, "Article signalé", "TOUS");
        String publicationId = JsonPath.read(mvc.perform(get("/api/articles/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andReturn().getResponse().getContentAsString(), "$.publicationId");
        Publication porteuse = publications.findById(UUID.fromString(publicationId)).orElseThrow();
        porteuse.setStatut(StatutPublication.MASQUE);
        publications.saveAndFlush(porteuse);
        mvc.perform(get("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(lecteur))).andExpect(status().isNotFound());
        mvc.perform(get("/api/articles").param("recherche", "Article signalé").header(HttpHeaders.AUTHORIZATION, jeton(lecteur)))
            .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nombreJaime").value(0));
    }

    @Test
    void supprimerRetireLArticleEtSaPublicationPorteuse() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        String id = publier(auteur, "Article retiré", "TOUS");
        String publicationId = JsonPath.read(mvc.perform(get("/api/articles/{id}", id)
            .header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andReturn().getResponse().getContentAsString(), "$.publicationId");
        mvc.perform(delete("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(membre(TypeRole.ALUMNI))))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andExpect(status().isNoContent());
        mvc.perform(get("/api/articles/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andExpect(status().isNotFound());
        assertEquals(StatutPublication.SUPPRIME, publications.findById(UUID.fromString(publicationId)).orElseThrow().getStatut());
    }

    @Test
    void unArticleNeSePubliePasDepuisLesPublications() throws Exception {
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(membre(TypeRole.ALUMNI)))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"type\":\"ARTICLE\",\"audience\":\"TOUS\",\"contenu\":\"Contournement\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Un article se publie depuis l'espace Articles."));
    }

    @Test
    void lesBrouillonsSontLimitesParAuteur() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        for (int i = 0; i < 20; i++) creer(auteur, "Brouillon " + i, null, "", "TOUS");
        mvc.perform(post("/api/articles").header(HttpHeaders.AUTHORIZATION, jeton(auteur))
            .contentType(MediaType.APPLICATION_JSON).content(corps("Un de trop", null, "", "TOUS")))
            .andExpect(status().isConflict());
    }

    @Test
    void laCouvertureSuitLaVisibiliteDeLArticle() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(160, 90, BufferedImage.TYPE_INT_RGB), "png", sortie);
        MockMultipartFile donnees = new MockMultipartFile("article", "", "application/json",
            corps("Avec couverture", "Résumé", CORPS, "TOUS").getBytes());
        MockMultipartFile image = new MockMultipartFile("couverture", "couverture.png", "image/png", sortie.toByteArray());
        String id = JsonPath.read(mvc.perform(multipart("/api/articles").file(donnees).file(image)
            .header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString(), "$.id");
        Utilisateur lecteur = membre(TypeRole.ETUDIANT);
        mvc.perform(get("/api/articles/{id}/couverture", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_PNG));
        mvc.perform(get("/api/articles/{id}/couverture", id).header(HttpHeaders.AUTHORIZATION, jeton(lecteur)))
            .andExpect(status().isNotFound());
        mvc.perform(patch("/api/articles/{id}/publier", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.urlCouverture").value("/api/articles/" + id + "/couverture"));
        mvc.perform(get("/api/articles/{id}/couverture", id).header(HttpHeaders.AUTHORIZATION, jeton(lecteur)))
            .andExpect(status().isOk());
        mvc.perform(delete("/api/articles/{id}/couverture", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.urlCouverture").doesNotExist());
    }

    private String creer(Utilisateur auteur, String titre, String resume, String contenu, String audience) throws Exception {
        String reponse = mvc.perform(post("/api/articles").header(HttpHeaders.AUTHORIZATION, jeton(auteur))
            .contentType(MediaType.APPLICATION_JSON).content(corps(titre, resume, contenu, audience)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(reponse, "$.id");
    }

    private String publier(Utilisateur auteur, String titre, String audience) throws Exception {
        String id = creer(auteur, titre, "Résumé de " + titre, CORPS, audience);
        mvc.perform(patch("/api/articles/{id}/publier", id).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk());
        return id;
    }

    private static String corps(String titre, String resume, String contenu, String audience) {
        return "{\"titre\":" + json(titre) + ",\"resume\":" + json(resume) + ",\"contenu\":" + json(contenu)
            + ",\"theme\":\"PARCOURS\",\"audience\":\"" + audience + "\"}";
    }

    private static String json(String valeur) {
        return valeur == null ? "null" : "\"" + valeur.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }

    private Utilisateur membre(TypeRole role) {
        Utilisateur membre = new Utilisateur();
        membre.setEmail("test.article." + UUID.randomUUID() + "@example.invalid");
        membre.setPassword("hash-de-test");
        membre.setNom("Test");
        membre.setPrenom("Auteur");
        membre.setRole(role);
        membre.setStatutCompte(StatutCompte.ACTIF);
        membre.setEmailVerifie(true);
        return utilisateurs.saveAndFlush(membre);
    }

    private String jeton(Utilisateur membre) {
        return "Bearer " + jwt.genererToken(new UtilisateurPrincipal(membre));
    }
}
