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
            "{\"type\":\"PUBLICATION\",\"audience\":\"ETUDIANTS\",\"contenu\":\"Bonjour\"}".getBytes());
        MockMultipartFile image = new MockMultipartFile("image", "photo.png", "image/png", sortie.toByteArray());
        var resultat = mvc.perform(multipart("/api/publications").file(donnees).file(image)
            .header(HttpHeaders.AUTHORIZATION, jeton(auteur))).andExpect(status().isCreated()).andReturn();
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
            + ",\"auteurId\":\"" + admin.getId() + "\",\"urlImage\":\"https://example.invalid/image.png\"}";
        mvc.perform(post("/api/publications").header(HttpHeaders.AUTHORIZATION, jeton(membre))
            .contentType(MediaType.APPLICATION_JSON).content(corps))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.auteurId").value(membre.getId().toString()))
            .andExpect(jsonPath("$.contenu").value("Bonjour"))
            .andExpect(jsonPath("$.urlImage").doesNotExist())
            .andExpect(jsonPath("$.email").doesNotExist()).andExpect(jsonPath("$.telephone").doesNotExist());
        String officiel = "{\"type\":\"ANNONCE_OFFICIELLE\",\"audience\":\"TOUS\",\"contenu\":\"Annonce\"}";
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
