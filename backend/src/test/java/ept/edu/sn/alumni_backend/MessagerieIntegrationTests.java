package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Service et API de la messagerie (#210) : conversations directes, groupes, messages, non-lus. */
@SpringBootTest
@AutoConfigureMockMvc
class MessagerieIntegrationTests {
    private static final String API = "/api/messagerie";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private ConversationRepository conversations;
    @Autowired private ParticipantRepository participants;
    @Autowired private MessageRepository messages;
    @Autowired private NotificationRepository notifications;

    /** La base est partagée : on retire tout ce qui référence les utilisateurs, dans l'ordre des clés étrangères. */
    @AfterEach
    void nettoyer() {
        notifications.deleteAll();
        messages.deleteAll();
        participants.deleteAll();
        conversations.deleteAll();
    }

    // --- Conversations directes ---

    @Test
    void m01_sansConnexionLaMessagerieEstFermee() throws Exception {
        // Convention du projet : 403 sans jeton, 401 réservé au compte suspendu.
        mockMvc.perform(get(API + "/conversations")).andExpect(status().isForbidden());
        mockMvc.perform(get(API + "/non-lus")).andExpect(status().isForbidden());
    }

    @Test
    void m02_ouvrirUneConversationDirecteLaCreeUneSeuleFoisQuelQueSoitLeSens() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ETUDIANT);

        String id = JsonPath.read(ouvrirDirecte(awa, moussa)
            .andExpect(status().isCreated())
            .andExpect(header().string(HttpHeaders.LOCATION, startsWith(API + "/conversations/")))
            .andExpect(jsonPath("$.type").value("DIRECTE"))
            .andExpect(jsonPath("$.nom").value("Moussa " + moussa.getNom()))
            .andExpect(jsonPath("$.interlocuteur.id").value(moussa.getId().toString()))
            .andExpect(jsonPath("$.nombreParticipants").value(2))
            .andReturn().getResponse().getContentAsString(), "$.id");

        ouvrirDirecte(awa, moussa).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
        ouvrirDirecte(moussa, awa).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id))
            .andExpect(jsonPath("$.nom").value("Awa " + awa.getNom()));
        assertThat(conversations.count()).isEqualTo(1);
    }

    @Test
    void m03_onNeSEcritPasASoiMemeNiAUnCompteInjoignable() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur suspendu = membre("Suspendu", TypeRole.ALUMNI);
        suspendu.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurs.saveAndFlush(suspendu);

        ouvrirDirecte(awa, awa).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Vous ne pouvez pas vous écrire à vous-même."));
        ouvrirDirecte(awa, suspendu).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(post(API + "/conversations/directes"), awa)
                .contentType(MediaType.APPLICATION_JSON).content("{\"destinataireId\":\"" + UUID.randomUUID() + "\"}"))
            .andExpect(status().isNotFound());
        assertThat(conversations.count()).isZero();
    }

    @Test
    void m04_seulsLesParticipantsVoientUneConversation() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        Utilisateur intrus = membre("Intrus", TypeRole.ALUMNI);
        String id = idDe(ouvrirDirecte(awa, moussa));

        mockMvc.perform(authentifie(get(API + "/conversations/{id}", id), intrus)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", id), intrus)).andExpect(status().isNotFound());
        envoyer(intrus, id, "Je m'invite").andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(API + "/conversations"), intrus))
            .andExpect(status().isOk()).andExpect(jsonPath("$.contenu", hasSize(0)));
    }

    // --- Messages ---

    @Test
    void m05_lHistoriqueSeChargePageParPageDuPlusAncienAuPlusRecent() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        String id = idDe(ouvrirDirecte(awa, moussa));
        envoyer(awa, id, "  Premier  ").andExpect(status().isCreated())
            .andExpect(jsonPath("$.contenu").value("Premier")).andExpect(jsonPath("$.deMoi").value(true));
        envoyer(moussa, id, "Deuxième").andExpect(status().isCreated());
        envoyer(awa, id, "Troisième").andExpect(status().isCreated());

        String page = mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", id).param("taille", "2"), moussa))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.messages[0].contenu").value("Deuxième"))
            .andExpect(jsonPath("$.messages[0].deMoi").value(true))
            .andExpect(jsonPath("$.messages[1].contenu").value("Troisième"))
            .andExpect(jsonPath("$.plusAnciens").value(true))
            .andReturn().getResponse().getContentAsString();
        String avant = JsonPath.read(page, "$.messages[0].envoyeLe");

        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", id).param("taille", "2").param("avant", avant), moussa))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.messages", hasSize(1)))
            .andExpect(jsonPath("$.messages[0].contenu").value("Premier"))
            .andExpect(jsonPath("$.plusAnciens").value(false));
    }

    @Test
    void m06_unMessageVideOuTropLongEstRefuse() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        String id = idDe(ouvrirDirecte(awa, moussa));

        envoyer(awa, id, "   ").andExpect(status().isBadRequest());
        envoyer(awa, id, "a".repeat(2001)).andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", id).param("taille", "51"), awa))
            .andExpect(status().isBadRequest());
        assertThat(messages.countByConversationId(UUID.fromString(id))).isZero();
    }

    @Test
    void m07_lesNonLusSeComptentParConversationEtSeRemettentAZero() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        String id = idDe(ouvrirDirecte(awa, moussa));
        envoyer(awa, id, "Bonjour").andExpect(status().isCreated());
        envoyer(awa, id, "Tu es là ?").andExpect(status().isCreated());

        mockMvc.perform(authentifie(get(API + "/conversations"), moussa))
            .andExpect(jsonPath("$.contenu[0].nombreNonLus").value(2))
            .andExpect(jsonPath("$.contenu[0].dernierMessage.contenu").value("Tu es là ?"));
        mockMvc.perform(authentifie(get(API + "/non-lus"), moussa)).andExpect(jsonPath("$.nombre").value(2));
        mockMvc.perform(authentifie(get(API + "/non-lus"), awa)).andExpect(jsonPath("$.nombre").value(0));

        mockMvc.perform(authentifie(patch(API + "/conversations/{id}/lu", id), moussa)).andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get(API + "/non-lus"), moussa)).andExpect(jsonPath("$.nombre").value(0));
    }

    @Test
    void m08_uneSeuleNotificationTantQueLaConversationResteNonLue() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        String id = idDe(ouvrirDirecte(awa, moussa));

        envoyer(awa, id, "Un").andExpect(status().isCreated());
        envoyer(awa, id, "Deux").andExpect(status().isCreated());
        assertThat(notifications.countByDestinataire_IdAndLueFalse(moussa.getId())).isEqualTo(1);
        assertThat(notifications.countByDestinataire_IdAndLueFalse(awa.getId())).isZero();

        mockMvc.perform(authentifie(patch(API + "/conversations/{id}/lu", id), moussa)).andExpect(status().isNoContent());
        envoyer(awa, id, "Trois").andExpect(status().isCreated());
        assertThat(notifications.countByDestinataire_IdAndLueFalse(moussa.getId())).isEqualTo(2);
    }

    @Test
    void m09_seulLAuteurSupprimeSonMessageQuiResteAfficheCommeSupprime() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        String id = idDe(ouvrirDirecte(awa, moussa));
        String messageId = idDe(envoyer(awa, id, "Oups"));

        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/messages/{m}", id, messageId), moussa))
            .andExpect(status().isForbidden());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/messages/{m}", id, messageId), awa))
            .andExpect(status().isNoContent());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/messages/{m}", id, messageId), awa))
            .andExpect(status().isNoContent());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/messages/{m}", id, UUID.randomUUID()), awa))
            .andExpect(status().isNotFound());

        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", id), moussa))
            .andExpect(jsonPath("$.messages[0].supprime").value(true))
            .andExpect(jsonPath("$.messages[0].contenu").value(nullValue()));
        mockMvc.perform(authentifie(get(API + "/non-lus"), moussa)).andExpect(jsonPath("$.nombre").value(0));
    }

    // --- Groupes ---

    @Test
    void m10_leCreateurDUnGroupeEnEstAdministrateur() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ETUDIANT);
        Utilisateur fatou = membre("Fatou", TypeRole.PERSONNEL);

        String id = idDe(creerGroupe(awa, "Promo 2018", moussa, fatou, awa)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.type").value("GROUPE"))
            .andExpect(jsonPath("$.nom").value("Promo 2018"))
            .andExpect(jsonPath("$.monRole").value("ADMINISTRATEUR"))
            .andExpect(jsonPath("$.participants", hasSize(3))));

        mockMvc.perform(authentifie(get(API + "/conversations/{id}", id), moussa))
            .andExpect(status().isOk()).andExpect(jsonPath("$.monRole").value("MEMBRE"));
        envoyer(fatou, id, "Bonjour à tous").andExpect(status().isCreated());
        assertThat(notifications.countByDestinataire_IdAndLueFalse(awa.getId())).isEqualTo(1);
        assertThat(notifications.countByDestinataire_IdAndLueFalse(moussa.getId())).isEqualTo(1);
    }

    @Test
    void m11_seulUnAdministrateurRenommeEtAjouteDesMembres() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        Utilisateur fatou = membre("Fatou", TypeRole.ALUMNI);
        String id = idDe(creerGroupe(awa, "Génie info", moussa));

        mockMvc.perform(authentifie(patch(API + "/conversations/{id}", id), moussa)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Piratage\"}"))
            .andExpect(status().isForbidden());
        ajouter(moussa, id, fatou).andExpect(status().isForbidden());

        mockMvc.perform(authentifie(patch(API + "/conversations/{id}", id), awa)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"  Génie informatique  \"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nom").value("Génie informatique"));
        ajouter(awa, id, fatou, moussa).andExpect(status().isOk()).andExpect(jsonPath("$.participants", hasSize(3)));
    }

    @Test
    void m12_uneConversationDirecteNeSeRenommePasEtNeSAgranditPas() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        Utilisateur fatou = membre("Fatou", TypeRole.ALUMNI);
        String id = idDe(ouvrirDirecte(awa, moussa));

        mockMvc.perform(authentifie(patch(API + "/conversations/{id}", id), awa)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Nous deux\"}"))
            .andExpect(status().isConflict());
        ajouter(awa, id, fatou).andExpect(status().isConflict());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{u}", id, awa.getId()), awa))
            .andExpect(status().isConflict());
    }

    @Test
    void m13_quitterLeGroupeEtLeDernierAdministrateurEstRemplace() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        Utilisateur fatou = membre("Fatou", TypeRole.ALUMNI);
        String id = idDe(creerGroupe(awa, "Bureau", moussa, fatou));

        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{u}", id, fatou.getId()), moussa))
            .andExpect(status().isForbidden());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{u}", id, fatou.getId()), fatou))
            .andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", id), fatou)).andExpect(status().isNotFound());

        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{u}", id, awa.getId()), awa))
            .andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", id), moussa))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.monRole").value("ADMINISTRATEUR"))
            .andExpect(jsonPath("$.participants", hasSize(1)));
    }

    // --- Temps réel ---

    @Test
    void m14_leFluxSOuvreParUnSignalPretEtResteFermeSansConnexion() throws Exception {
        mockMvc.perform(get(API + "/flux")).andExpect(status().isForbidden());

        MockHttpServletResponse flux = ouvrirFlux(membre("Awa", TypeRole.ALUMNI));
        assertThat(flux.getContentType()).startsWith(MediaType.TEXT_EVENT_STREAM_VALUE);
        assertThat(flux.getContentAsString()).contains("event:pret");
    }

    @Test
    void m15_unMessagePrevientLesParticipantsEtPersonneDAutre() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ETUDIANT);
        Utilisateur intrus = membre("Intrus", TypeRole.ALUMNI);
        String id = JsonPath.read(ouvrirDirecte(awa, moussa).andReturn().getResponse().getContentAsString(), "$.id");
        MockHttpServletResponse fluxMoussa = ouvrirFlux(moussa);
        MockHttpServletResponse fluxIntrus = ouvrirFlux(intrus);

        envoyer(awa, id, "Bonjour").andExpect(status().isCreated());

        // Le signal ne porte que l'identifiant : le contenu se relit par l'API, qui vérifie les droits.
        assertThat(fluxMoussa.getContentAsString())
            .contains("event:message")
            .contains("\"conversationId\":\"" + id + "\"")
            .doesNotContain("Bonjour");
        assertThat(fluxIntrus.getContentAsString()).doesNotContain("event:message").doesNotContain(id);
    }

    @Test
    void m16_lireOuQuitterUneConversationPrevientLesBonnesPersonnes() throws Exception {
        Utilisateur awa = membre("Awa", TypeRole.ALUMNI);
        Utilisateur moussa = membre("Moussa", TypeRole.ALUMNI);
        Utilisateur fatou = membre("Fatou", TypeRole.ALUMNI);
        String id = idDe(creerGroupe(awa, "Bureau", moussa, fatou));
        MockHttpServletResponse fluxAwa = ouvrirFlux(awa);
        MockHttpServletResponse fluxFatou = ouvrirFlux(fatou);
        MockHttpServletResponse fluxMoussa = ouvrirFlux(moussa);

        // Lire ne concerne que moi (mes autres onglets), par un signal distinct que le fil ignore.
        mockMvc.perform(authentifie(patch(API + "/conversations/{id}/lu", id), moussa)).andExpect(status().isNoContent());
        assertThat(fluxMoussa.getContentAsString()).contains("event:lu").contains(id).doesNotContain("event:conversation");
        assertThat(fluxAwa.getContentAsString()).doesNotContain("event:lu").doesNotContain("event:conversation");

        // La personne retirée est prévenue aussi : son onglet quitte la conversation.
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{u}", id, fatou.getId()), awa))
            .andExpect(status().isNoContent());
        assertThat(fluxFatou.getContentAsString()).contains("event:conversation").contains(id);
        assertThat(fluxAwa.getContentAsString()).contains("event:conversation");
    }

    // --- Outils ---

    private MockHttpServletResponse ouvrirFlux(Utilisateur utilisateur) throws Exception {
        return mockMvc.perform(authentifie(get(API + "/flux"), utilisateur).accept(MediaType.TEXT_EVENT_STREAM))
            .andExpect(request().asyncStarted())
            .andReturn().getResponse();
    }

    private Utilisateur membre(String prenom, TypeRole role) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("messagerie-api." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom(prenom);
        utilisateur.setNom("Msg" + UUID.randomUUID().toString().substring(0, 8));
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        return utilisateurs.saveAndFlush(utilisateur);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }

    private ResultActions ouvrirDirecte(Utilisateur moi, Utilisateur destinataire) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/directes"), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"destinataireId\":\"" + destinataire.getId() + "\"}"));
    }

    private ResultActions creerGroupe(Utilisateur moi, String nom, Utilisateur... membres) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/groupes"), moi)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"nom\":\"" + nom + "\",\"membreIds\":" + ids(membres) + "}"));
    }

    private ResultActions ajouter(Utilisateur moi, String conversationId, Utilisateur... membres) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/{id}/participants", conversationId), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"membreIds\":" + ids(membres) + "}"));
    }

    /** Une pause d'une milliseconde garde des dates d'envoi distinctes : l'ordre de l'historique est alors certain. */
    private ResultActions envoyer(Utilisateur moi, String conversationId, String contenu) throws Exception {
        Thread.sleep(2);
        return mockMvc.perform(authentifie(post(API + "/conversations/{id}/messages", conversationId), moi)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"contenu\":\"" + contenu + "\"}"));
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
