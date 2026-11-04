package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
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

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PublicationApiIntegrationTests {
    @Autowired private MockMvc mvc;
    @Autowired private JwtService jwt;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private PublicationRepository publications;

    @Test
    void imageRespecteAudienceEtRefuseUnContenuInvalide() throws Exception {
        Utilisateur auteur = membre(TypeRole.PERSONNEL);
        Utilisateur etudiant = membre(TypeRole.ETUDIANT);
        Utilisateur alumni = membre(TypeRole.ALUMNI);
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(40, 80, BufferedImage.TYPE_INT_RGB), "png", sortie);
        MockMultipartFile donnees = new MockMultipartFile("publication", "", "application/json",
            ("{\"type\":\"PUBLICATION\",\"audience\":\"ETUDIANTS\",\"contenu\":\"Bonjour\","
                + "\"texteAlternatif\":\"  Promotion 2026 devant l’amphithéâtre  \"}").getBytes());
        MockMultipartFile image = new MockMultipartFile("image", "photo.png", "image/png", sortie.toByteArray());
        var resultat = mvc.perform(multipart("/api/publications").file(donnees).file(image)
            .header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andExpect(status().isCreated())
            .andExpect(jsonPath("$.texteAlternatif").value("Promotion 2026 devant l’amphithéâtre")).andReturn();
        String reponse = resultat.getResponse().getContentAsString();
        String id = publications.findAll().stream().filter(p -> p.getAuteur().getId().equals(auteur.getId()))
            .findFirst().orElseThrow().getId().toString();
        org.junit.jupiter.api.Assertions.assertTrue(reponse.contains("/api/publications/" + id + "/image"));
        mvc.perform(get("/api/publications/{id}/image", id)).andExpect(status().isForbidden());
        mvc.perform(get("/api/publications/{id}/image", id).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/publications/{id}/image", id).header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(status().isOk()).andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.IMAGE_PNG));
        Publication masquee = publications.findById(UUID.fromString(id)).orElseThrow();
        masquee.setStatut(StatutPublication.MASQUE);
        publications.saveAndFlush(masquee);
        mvc.perform(get("/api/publications/{id}/image", id).header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(status().isNotFound());
        MockMultipartFile faux = new MockMultipartFile("image", "photo.png", "image/png", "texte".getBytes());
        mvc.perform(multipart("/api/publications").file(donnees).file(faux)
            .header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andExpect(status().isBadRequest());
        MockMultipartFile tropGros = new MockMultipartFile("image", "photo.png", "image/png", new byte[5 * 1024 * 1024 + 1]);
        mvc.perform(multipart("/api/publications").file(donnees).file(tropGros)
            .header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andExpect(status().isBadRequest());
    }

    @Test
    void commentairesRespectentAudienceEtReponsesRestentLieesAuCommentaireParent() throws Exception {
        Utilisateur auteur = membre(TypeRole.PERSONNEL);
        Utilisateur etudiant = membre(TypeRole.ETUDIANT);
        Utilisateur alumni = membre(TypeRole.ALUMNI);
        Publication cible = publication(auteur, AudiencePublication.ETUDIANTS, StatutPublication.PUBLIE);
        String chemin = "/api/publications/" + cible.getId() + "/commentaires";
        mvc.perform(get(chemin)).andExpect(status().isForbidden());
        mvc.perform(get(chemin).header(HttpHeaders.AUTHORIZATION, jeton(alumni))).andExpect(status().isNotFound());
        MvcResult racine = mvc.perform(post(chemin).header(HttpHeaders.AUTHORIZATION, jeton(etudiant))
            .contentType(MediaType.APPLICATION_JSON).content("{\"contenu\":\" Commentaire racine \"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.contenu").value("Commentaire racine"))
            .andExpect(jsonPath("$.parentId").doesNotExist()).andReturn();
        String parentId = com.jayway.jsonpath.JsonPath.read(racine.getResponse().getContentAsString(), "$.id");
        mvc.perform(post(chemin).header(HttpHeaders.AUTHORIZATION, jeton(auteur)).contentType(MediaType.APPLICATION_JSON)
            .content("{\"contenu\":\"Réponse\",\"parentId\":\"" + parentId + "\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.parentId").value(parentId));
        mvc.perform(get(chemin).header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.contenu[0].auteurId").value(etudiant.getId().toString()));
        Publication autre = publication(auteur, AudiencePublication.TOUS, StatutPublication.PUBLIE);
        mvc.perform(post("/api/publications/{id}/commentaires", autre.getId())
            .header(HttpHeaders.AUTHORIZATION, jeton(etudiant)).contentType(MediaType.APPLICATION_JSON)
            .content("{\"contenu\":\"Réponse étrangère\",\"parentId\":\"" + parentId + "\"}"))
            .andExpect(status().isNotFound());
        MvcResult intermediaire = mvc.perform(post(chemin).header(HttpHeaders.AUTHORIZATION, jeton(auteur))
            .contentType(MediaType.APPLICATION_JSON).content("{\"contenu\":\"Réponse intermédiaire\",\"parentId\":\"" + parentId + "\"}"))
            .andExpect(status().isCreated()).andReturn();
        String reponseId = com.jayway.jsonpath.JsonPath.read(intermediaire.getResponse().getContentAsString(), "$.id");
        mvc.perform(post(chemin).header(HttpHeaders.AUTHORIZATION, jeton(etudiant))
            .contentType(MediaType.APPLICATION_JSON).content("{\"contenu\":\"Niveau deux\",\"parentId\":\"" + reponseId + "\"}"))
            .andExpect(status().isNotFound()).andReturn();
        mvc.perform(post(chemin).header(HttpHeaders.AUTHORIZATION, jeton(etudiant)).contentType(MediaType.APPLICATION_JSON)
            .content("{\"contenu\":\"   \"}" )).andExpect(status().isBadRequest());
    }

    @Test
    void exigeUneSessionEtValideLeContenu() throws Exception {
        mvc.perform(get("/api/publications")).andExpect(status().isForbidden());
        mvc.perform(get("/api/publications").header(HttpHeaders.AUTHORIZATION, "Bearer jeton-invalide"))
            .andExpect(status().isUnauthorized());
        Utilisateur membre = membre(TypeRole.ALUMNI);
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(membre))
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"type\":\"PUBLICATION\",\"audience\":\"TOUS\",\"contenu\":\"  \"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(membre))
            .param("taille", "49")).andExpect(status().isBadRequest());
        membre.setEmailVerifie(false);
        utilisateurs.saveAndFlush(membre);
        mvc.perform(get("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(membre)))
            .andExpect(status().isForbidden());
    }

    @Test
    void protegeLauteurEtLesAnnoncesOfficielles() throws Exception {
        Utilisateur membre = membre(TypeRole.VISITEUR);
        Utilisateur admin = membre(TypeRole.ADMIN);
        String corps = "{\"type\":\"PUBLICATION\",\"audience\":\"TOUS\",\"contenu\":\" Bonjour \""
            + ",\"auteurId\":\"" + admin.getId() + "\",\"urlImage\":\"https://example.invalid/image.png\""
            + ",\"texteAlternatif\":\"Sans image, ignoré\"}";
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(membre))
            .contentType(MediaType.APPLICATION_JSON).content(corps))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.auteurId").value(membre.getId().toString()))
            .andExpect(jsonPath("$.contenu").value("Bonjour"))
            .andExpect(jsonPath("$.urlImage").doesNotExist())
            .andExpect(jsonPath("$.texteAlternatif").doesNotExist())
            .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.telephone").doesNotExist());
        String officiel = "{\"type\":\"ANNONCE_OFFICIELLE\",\"titre\":\"Rentrée\",\"audience\":\"TOUS\",\"contenu\":\"Annonce\"}";
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(membre))
            .contentType(MediaType.APPLICATION_JSON).content(officiel)).andExpect(status().isForbidden());
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(admin))
            .contentType(MediaType.APPLICATION_JSON).content(officiel))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.type").value("ANNONCE_OFFICIELLE"));
    }

    @Test
    void filtreAudienceEtStatutEnListeEtEnDetail() throws Exception {
        Utilisateur auteur = membre(TypeRole.PERSONNEL);
        Utilisateur alumni = membre(TypeRole.ALUMNI);
        Utilisateur etudiant = membre(TypeRole.ETUDIANT);
        Publication cible = publication(auteur, AudiencePublication.ETUDIANTS, StatutPublication.PUBLIE);
        Publication masquee = publication(auteur, AudiencePublication.TOUS, StatutPublication.MASQUE);
        mvc.perform(get("/api/publications/{id}", cible.getId()).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/publications/{id}", cible.getId()).header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(status().isOk());
        mvc.perform(get("/api/publications/{id}", cible.getId()).header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isOk());
        mvc.perform(get("/api/publications/{id}", masquee.getId()).header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void bloqueLeCompteSuspenduEtLaPremiereConnexion() throws Exception {
        Utilisateur suspendu = membre(TypeRole.ALUMNI);
        String jetonSuspendu = jeton(suspendu);
        suspendu.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurs.saveAndFlush(suspendu);
        mvc.perform(get("/api/publications").header(HttpHeaders.AUTHORIZATION, jetonSuspendu))
            .andExpect(status().isUnauthorized());
        Utilisateur etudiant = membre(TypeRole.ETUDIANT);
        etudiant.setDoitChangerMotDePasse(true);
        utilisateurs.saveAndFlush(etudiant);
        mvc.perform(get("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(etudiant)))
            .andExpect(status().isForbidden());
    }

    @Test
    void limiteLesCreationsParAuteurSansIgnorerLesPublicationsMasquees() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        Utilisateur autre = membre(TypeRole.ALUMNI);
        for (int i = 0; i < 10; i++) {
            publication(auteur, AudiencePublication.TOUS, i == 0 ? StatutPublication.MASQUE : StatutPublication.PUBLIE);
        }
        String corps = "{\"type\":\"PUBLICATION\",\"audience\":\"TOUS\",\"contenu\":\"Bonjour\"}";
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(auteur))
                .contentType(MediaType.APPLICATION_JSON).content(corps))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.message").value("La limite de publications sur 24 heures est atteinte."));
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(autre))
                .contentType(MediaType.APPLICATION_JSON).content(corps))
            .andExpect(status().isCreated());
    }

    @Test
    void unLienPartageEstEnregistreAvecSonSiteEtLesAdressesInternesSontRefusees() throws Exception {
        Utilisateur auteur = membre(TypeRole.ALUMNI);
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(auteur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"PUBLICATION\",\"audience\":\"TOUS\",\"contenu\":\"Mon stage commence\","
                    + "\"lien\":\" www.linkedin.com/posts/membre_stage-123#commentaires \"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.lien.url").value("https://www.linkedin.com/posts/membre_stage-123"))
            .andExpect(jsonPath("$.lien.site").value("linkedin.com"));
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(auteur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"PUBLICATION\",\"audience\":\"TOUS\",\"contenu\":\"Sans lien\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.lien").doesNotExist());
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(auteur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"PUBLICATION\",\"audience\":\"TOUS\",\"contenu\":\"x\",\"lien\":\"ftp://exemple.sn\"}"))
            .andExpect(status().isBadRequest());

        mvc.perform(post("/api/apercus-lien").contentType(MediaType.APPLICATION_JSON).content("{\"url\":\"https://exemple.sn\"}"))
            .andExpect(status().isForbidden());
        for (String interne : new String[] {"http://127.0.0.1/admin", "http://169.254.169.254/latest/meta-data", "http://localhost:8080/"}) {
            mvc.perform(post("/api/apercus-lien").header(HttpHeaders.AUTHORIZATION, jeton(auteur))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"url\":\"" + interne + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Seuls les liens web publics peuvent être importés."));
        }
        mvc.perform(get("/api/apercus-lien/image").param("url", "http://127.0.0.1/a.jpg")
                .header(HttpHeaders.AUTHORIZATION, jeton(auteur)))
            .andExpect(status().isNotFound());
    }

    private Utilisateur membre(TypeRole role) {
        Utilisateur membre = new Utilisateur();
        membre.setEmail("test.publication." + UUID.randomUUID() + "@example.invalid");
        membre.setPassword("hash-de-test");
        membre.setNom("Test");
        membre.setPrenom("Membre");
        membre.setRole(role);
        membre.setStatutCompte(StatutCompte.ACTIF);
        membre.setEmailVerifie(true);
        return utilisateurs.saveAndFlush(membre);
    }

    private String jeton(Utilisateur membre) {
        return "Bearer " + jwt.genererToken(new UtilisateurPrincipal(membre));
    }

    private Publication publication(Utilisateur auteur, AudiencePublication audience, StatutPublication statut) {
        Publication publication = new Publication();
        publication.setAuteur(auteur);
        publication.setType(TypePublication.PUBLICATION);
        publication.setContenu("Contenu de test");
        publication.setAudience(audience);
        publication.setStatut(statut);
        return publications.saveAndFlush(publication);
    }
}
