package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.messagerie.repository.BlocageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Blocage entre membres et gestion des groupes : rôles, suppression, photo et description. */
@SpringBootTest
@AutoConfigureMockMvc
class MessagerieBlocageGroupesIntegrationTests {
    private static final String API = "/api/messagerie";
    private static final String J_AI_BLOQUE = "Vous avez bloqué ce membre. Débloquez-le pour lui écrire.";
    private static final String ECRITURE_FERMEE = "Vous ne pouvez plus écrire dans cette conversation.";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private ConversationRepository conversations;
    @Autowired private ParticipantRepository participants;
    @Autowired private MessageRepository messages;
    @Autowired private BlocageRepository blocages;
    @Autowired private NotificationRepository notifications;
    @Autowired private OrganismeRepository organismes;
    @Value("${app.storage.photos.dir:./data/photos}") private String repertoirePhotos;

    @AfterEach
    void nettoyer() {
        blocages.deleteAll();
        notifications.deleteAll();
        messages.deleteAll();
        participants.deleteAll();
        conversations.deleteAll();
    }

    // --- Blocage ---

    @Test
    void b01_unBlocageFermeLaConversationDirecteDansLesDeuxSensMaisPasLesGroupes() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String directe = idDe(ouvrirDirecte(awa, moussa));
        String groupe = idDe(creerGroupe(awa, "Promo 2020", moussa));

        bloquer(awa, moussa).andExpect(status().isNoContent());

        envoyer(awa, directe, "Bonjour").andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(J_AI_BLOQUE));
        envoyer(moussa, directe, "Bonjour").andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(ECRITURE_FERMEE));
        envoyer(moussa, groupe, "Toujours là").andExpect(status().isCreated());
        envoyer(awa, groupe, "Moi aussi").andExpect(status().isCreated());

        mockMvc.perform(authentifie(get(API + "/conversations/{id}", directe), awa))
            .andExpect(jsonPath("$.ecriture").value("J_AI_BLOQUE"));
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", directe), moussa))
            .andExpect(jsonPath("$.ecriture").value("FERMEE"));
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", groupe), moussa))
            .andExpect(jsonPath("$.ecriture").value("OUVERTE"));
        mockMvc.perform(authentifie(get(API + "/blocages"), awa))
            .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(moussa.getId().toString()));
        mockMvc.perform(authentifie(get(API + "/blocages"), moussa)).andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(authentifie(delete(API + "/blocages/{id}", moussa.getId()), awa)).andExpect(status().isNoContent());
        envoyer(moussa, directe, "Merci").andExpect(status().isCreated());
        mockMvc.perform(authentifie(get(API + "/conversations"), awa))
            .andExpect(jsonPath("$.contenu[?(@.id == '" + directe + "')].ecriture").value("OUVERTE"));
    }

    @Test
    void b02_lePersonneBloqueeNOuvrePasDeNouvelleConversationMaisRelitLAncienne() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        Utilisateur fatou = membre("Fatou");
        String ancienne = idDe(ouvrirDirecte(awa, fatou));

        bloquer(awa, moussa).andExpect(status().isNoContent());
        bloquer(awa, fatou).andExpect(status().isNoContent());

        ouvrirDirecte(moussa, awa).andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Ce membre est introuvable."));
        ouvrirDirecte(awa, moussa).andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(J_AI_BLOQUE));
        ouvrirDirecte(fatou, awa).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(ancienne))
            .andExpect(jsonPath("$.ecriture").value("FERMEE"));
        assertThat(conversations.count()).isEqualTo(1);
    }

    @Test
    void b03_bloquerEstIdempotentSansPrevenirLaPersonneBloquee() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");

        bloquer(awa, awa).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Vous ne pouvez pas vous bloquer vous-même."));
        mockMvc.perform(authentifie(put(API + "/blocages/{id}", UUID.randomUUID()), awa)).andExpect(status().isNotFound());
        bloquer(awa, moussa).andExpect(status().isNoContent());
        bloquer(awa, moussa).andExpect(status().isNoContent());
        mockMvc.perform(authentifie(delete(API + "/blocages/{id}", UUID.randomUUID()), awa)).andExpect(status().isNoContent());

        assertThat(blocages.count()).isEqualTo(1);
        assertThat(notifications.count()).isZero();
        mockMvc.perform(put(API + "/blocages/{id}", moussa.getId())).andExpect(status().isForbidden());
    }

    // --- Compte suspendu ---

    @Test
    void s01_unMembreSuspenduFermeLaConversationDirecteJusquASaReactivation() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        Utilisateur fatou = membre("Fatou");
        String directe = idDe(ouvrirDirecte(awa, moussa));
        String groupe = idDe(creerGroupe(awa, "Promo 2018", moussa));

        changerStatut(moussa, StatutCompte.SUSPENDU);
        changerStatut(fatou, StatutCompte.SUSPENDU);

        envoyer(awa, directe, "Bonjour").andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(ECRITURE_FERMEE));
        envoyer(awa, groupe, "Le groupe reste ouvert").andExpect(status().isCreated());
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", directe), awa))
            .andExpect(jsonPath("$.ecriture").value("FERMEE"));
        mockMvc.perform(authentifie(get(API + "/conversations"), awa))
            .andExpect(jsonPath("$.contenu[?(@.id == '" + directe + "')].ecriture").value("FERMEE"));
        // Depuis le profil, la conversation existante se rouvre (fermée) ; une nouvelle ne se crée pas.
        ouvrirDirecte(awa, moussa).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(directe))
            .andExpect(jsonPath("$.ecriture").value("FERMEE"));
        ouvrirDirecte(awa, fatou).andExpect(status().isNotFound());

        changerStatut(moussa, StatutCompte.ACTIF);
        envoyer(awa, directe, "Bon retour").andExpect(status().isCreated());
    }

    // --- Liste : recherche et pages ---

    @Test
    void l01_laListeSeChercheParNomDeGroupeOuDInterlocuteurEtSeLitParPages() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String directe = idDe(ouvrirDirecte(awa, moussa));
        String promo = idDe(creerGroupe(awa, "Promo 2018", moussa));
        String club = idDe(creerGroupe(awa, "Club_IA", moussa));
        idDe(creerGroupe(awa, "Club des 100 %", moussa));
        String reseau = idDe(creerGroupe(awa, "Réseau Télécoms", moussa));

        rechercher(awa, "PROMO").andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.contenu[0].id").value(promo));
        rechercher(awa, " moussa ").andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].id").value(directe));
        // « _ » et « % » se cherchent tels quels, sans servir de jokers.
        rechercher(awa, "_").andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.contenu[0].id").value(club));
        rechercher(awa, "%").andExpect(jsonPath("$.totalElements").value(1));
        // Ni les majuscules ni les accents ne comptent, dans un sens comme dans l’autre.
        rechercher(awa, "reseau tele").andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].id").value(reseau));
        rechercher(awa, "TÉLÉCOMS").andExpect(jsonPath("$.contenu[0].id").value(reseau));
        // Moussa ne me trouve pas sous son propre nom, mais sous le mien.
        rechercher(moussa, "moussa").andExpect(jsonPath("$.totalElements").value(0));
        rechercher(moussa, "awa").andExpect(jsonPath("$.contenu[0].id").value(directe));

        mockMvc.perform(authentifie(get(API + "/conversations").param("page", "1").param("taille", "3"), awa))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(5))
            .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.contenu", hasSize(2)));
        rechercher(awa, "x".repeat(101)).andExpect(status().isBadRequest());
    }

    // --- Organisme ---

    @Test
    void o01_ecrireAUnOrganismeOuvreLaConversationAvecLeCompteQuiLeRepresente() throws Exception {
        Utilisateur awa = membre("Awa");
        Organisme organisme = organisme("Société messagerie");
        Utilisateur contact = membre("Contact");
        contact.setRole(TypeRole.ORGANISME);
        contact.setOrganisme(organisme);
        contact = utilisateurs.saveAndFlush(contact);

        String id = idDe(ecrireAOrganisme(awa, organisme.getId()).andExpect(status().isCreated())
            .andExpect(jsonPath("$.interlocuteur.id").value(contact.getId().toString())));
        ecrireAOrganisme(awa, organisme.getId()).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
        ouvrirDirecte(contact, awa).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
        ecrireAOrganisme(contact, organisme.getId()).andExpect(status().isBadRequest());
    }

    @Test
    void o02_unOrganismeSansCompteOuInconnuNeSeContactePas() throws Exception {
        Utilisateur awa = membre("Awa");
        String message = "Cet organisme ne peut pas être contacté pour l'instant.";

        ecrireAOrganisme(awa, organisme("Sans compte").getId()).andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value(message));
        ecrireAOrganisme(awa, UUID.randomUUID()).andExpect(status().isNotFound());
        assertThat(conversations.count()).isZero();
    }

    // --- Groupes ---

    @Test
    void g01_laDescriptionSeDonneALaCreationEtSeModifieParUnAdministrateur() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String groupe = idDe(mockMvc.perform(authentifie(post(API + "/conversations/groupes"), awa)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Club IA\",\"description\":\"  Veille et projets  \",\"membreIds\":" + ids(moussa) + "}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.description").value("Veille et projets")));

        modifier(awa, groupe, "{\"description\":\"Projets du jeudi\"}").andExpect(status().isOk())
            .andExpect(jsonPath("$.nom").value("Club IA")).andExpect(jsonPath("$.description").value("Projets du jeudi"));
        modifier(awa, groupe, "{\"nom\":\"Club IA EPT\"}").andExpect(status().isOk())
            .andExpect(jsonPath("$.description").value("Projets du jeudi"));
        modifier(awa, groupe, "{\"description\":\"\"}").andExpect(jsonPath("$.description").value(nullValue()));
        modifier(awa, groupe, "{\"nom\":\"   \"}").andExpect(status().isBadRequest());
        modifier(awa, groupe, "{}").andExpect(status().isBadRequest());
        modifier(awa, groupe, "{\"description\":\"" + "x".repeat(501) + "\"}").andExpect(status().isBadRequest());
        modifier(moussa, groupe, "{\"description\":\"Pirate\"}").andExpect(status().isForbidden());
    }

    @Test
    void g02_unAdministrateurNommeEtRetireDesAdministrateursSansLaisserLeGroupeSansAdministrateur() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        Utilisateur fatou = membre("Fatou");
        String groupe = idDe(creerGroupe(awa, "Bureau", moussa, fatou));

        changerRole(moussa, groupe, fatou, "ADMINISTRATEUR").andExpect(status().isForbidden());
        changerRole(awa, groupe, moussa, "ADMINISTRATEUR").andExpect(status().isOk())
            .andExpect(jsonPath("$.participants[?(@.id == '" + moussa.getId() + "')].roleParticipant").value("ADMINISTRATEUR"));
        changerRole(moussa, groupe, awa, "MEMBRE").andExpect(status().isOk());
        changerRole(moussa, groupe, moussa, "MEMBRE").andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Le groupe garde au moins un administrateur : nommez-en un autre d'abord."));
        changerRole(moussa, groupe, membre("Intrus"), "ADMINISTRATEUR").andExpect(status().isNotFound());
        changerRole(moussa, groupe, fatou, "ROI").andExpect(status().isBadRequest());

        String directe = idDe(ouvrirDirecte(awa, moussa));
        changerRole(awa, directe, moussa, "ADMINISTRATEUR").andExpect(status().isConflict());
    }

    @Test
    void g03_seulUnAdministrateurSupprimeLeGroupeEtTousEnPerdentLAcces() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String groupe = idDe(creerGroupe(awa, "Éphémère", moussa));
        envoyer(moussa, groupe, "Salut").andExpect(status().isCreated());

        mockMvc.perform(authentifie(delete(API + "/conversations/{id}", groupe), moussa)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}", groupe), awa)).andExpect(status().isNoContent());

        mockMvc.perform(authentifie(get(API + "/conversations/{id}", groupe), moussa)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(API + "/conversations"), moussa)).andExpect(jsonPath("$.contenu", hasSize(0)));
        assertThat(messages.countByConversationId(UUID.fromString(groupe))).isZero();

        String directe = idDe(ouvrirDirecte(awa, moussa));
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}", directe), awa)).andExpect(status().isConflict());
    }

    @Test
    void g04_laPhotoDuGroupeSeChangeEtSeRetireParUnAdministrateur() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String groupe = idDe(creerGroupe(awa, "Photographes", moussa));

        envoyerPhoto(moussa, groupe).andExpect(status().isForbidden());
        String url = JsonPath.read(envoyerPhoto(awa, groupe).andExpect(status().isOk())
            .andExpect(jsonPath("$.urlPhoto", startsWith("/api/photos/")))
            .andReturn().getResponse().getContentAsString(), "$.urlPhoto");
        Path fichier = Path.of(repertoirePhotos).toAbsolutePath().normalize().resolve(url.substring("/api/photos/".length()));
        assertThat(fichier).exists();
        mockMvc.perform(authentifie(get(API + "/conversations"), moussa))
            .andExpect(jsonPath("$.contenu[0].urlPhoto").value(url));

        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/photo", groupe), awa))
            .andExpect(status().isOk()).andExpect(jsonPath("$.urlPhoto").value(nullValue()));
        assertThat(Files.exists(fichier)).isFalse();
    }

    // --- Aides ---

    private Utilisateur membre(String prenom) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("messagerie-blocage." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom(prenom);
        utilisateur.setNom("Blq" + UUID.randomUUID().toString().substring(0, 8));
        utilisateur.setRole(TypeRole.ALUMNI);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        return utilisateurs.saveAndFlush(utilisateur);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }

    private ResultActions bloquer(Utilisateur moi, Utilisateur membre) throws Exception {
        return mockMvc.perform(authentifie(put(API + "/blocages/{id}", membre.getId()), moi));
    }

    private Organisme organisme(String nom) {
        Organisme organisme = new Organisme();
        organisme.setNom(nom);
        organisme.setTypeOrganisme(TypeOrganisme.ENTREPRISE);
        return organismes.saveAndFlush(organisme);
    }

    private void changerStatut(Utilisateur utilisateur, StatutCompte statut) {
        Utilisateur compte = utilisateurs.findById(utilisateur.getId()).orElseThrow();
        compte.setStatutCompte(statut);
        utilisateurs.saveAndFlush(compte);
    }

    private ResultActions rechercher(Utilisateur moi, String recherche) throws Exception {
        return mockMvc.perform(authentifie(get(API + "/conversations").param("recherche", recherche), moi));
    }

    private ResultActions ecrireAOrganisme(Utilisateur moi, UUID organismeId) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/organismes/{id}", organismeId), moi));
    }

    private ResultActions ouvrirDirecte(Utilisateur moi, Utilisateur destinataire) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/directes"), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"destinataireId\":\"" + destinataire.getId() + "\"}"));
    }

    private ResultActions creerGroupe(Utilisateur moi, String nom, Utilisateur... membres) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/groupes"), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"" + nom + "\",\"membreIds\":" + ids(membres) + "}"));
    }

    private ResultActions modifier(Utilisateur moi, String conversationId, String json) throws Exception {
        return mockMvc.perform(authentifie(patch(API + "/conversations/{id}", conversationId), moi)
            .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions changerRole(Utilisateur moi, String conversationId, Utilisateur membre, String role) throws Exception {
        return mockMvc.perform(authentifie(patch(API + "/conversations/{id}/participants/{membre}", conversationId, membre.getId()), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"" + role + "\"}"));
    }

    private ResultActions envoyer(Utilisateur moi, String conversationId, String contenu) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/{id}/messages", conversationId), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"contenu\":\"" + contenu + "\"}"));
    }

    private ResultActions envoyerPhoto(Utilisateur moi, String conversationId) throws Exception {
        BufferedImage image = new BufferedImage(640, 640, BufferedImage.TYPE_INT_RGB);
        Graphics2D dessin = image.createGraphics();
        dessin.setColor(new Color(1, 67, 101));
        dessin.fillRect(0, 0, 640, 640);
        dessin.dispose();
        ByteArrayOutputStream octets = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", octets);
        MockMultipartFile photo = new MockMultipartFile("photo", "groupe.jpg", "image/jpeg", octets.toByteArray());
        return mockMvc.perform(multipart(API + "/conversations/{id}/photo", conversationId).file(photo)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(moi))));
    }

    private static String ids(Utilisateur... membres) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < membres.length; i++) {
            if (i > 0) json.append(',');
            json.append('"').append(membres[i].getId()).append('"');
        }
        return json.append(']').toString();
    }

    private static String idDe(ResultActions resultat) throws Exception {
        return JsonPath.read(resultat.andReturn().getResponse().getContentAsString(), "$.id");
    }
}
