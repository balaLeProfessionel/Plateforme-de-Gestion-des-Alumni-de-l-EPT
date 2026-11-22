package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

/** Communautés : promo et filière automatiques, message d'arrivée, communautés ouvertes à rejoindre. */
@SpringBootTest
@AutoConfigureMockMvc
class MessagerieCommunautesIntegrationTests {
    private static final String API = "/api/messagerie";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private ConversationRepository conversations;
    @Autowired private ParticipantRepository participants;
    @Autowired private MessageRepository messages;
    @Autowired private NotificationRepository notifications;
    @Autowired private ept.edu.sn.alumni_backend.messagerie.service.CommunauteService communauteService;

    @AfterEach
    void nettoyer() {
        notifications.deleteAll();
        messages.deleteAll();
        participants.deleteAll();
        conversations.deleteAll();
    }

    @Test
    void c01_unAlumniEntreDansSaPromoSaFiliereEtLesDeuxCroiseesHorsDeLaListeDesConversations() throws Exception {
        Utilisateur awa = alumni("Awa", 1987, "Génie Civil");

        communautes(awa).andExpect(status().isOk())
            .andExpect(jsonPath("$.miennes", hasSize(3)))
            .andExpect(jsonPath("$.miennes[*].nom", containsInAnyOrder("Promo 1987", "Génie Civil", "Génie Civil · Promo 1987")))
            .andExpect(jsonPath("$.miennes[*].categorie", containsInAnyOrder("PROMO", "FILIERE", "PROMO_FILIERE")))
            .andExpect(jsonPath("$.aDecouvrir", hasSize(0)));
        mockMvc.perform(authentifie(get(API + "/conversations"), awa)).andExpect(jsonPath("$.contenu", hasSize(0)));

        // Même filière écrite autrement : une seule communauté « Génie Civil ».
        Utilisateur moussa = alumni("Moussa", 1987, "  genie civil ");
        communautes(moussa).andExpect(jsonPath("$.miennes", hasSize(3)));
        String promo = idCommunaute(awa, "PROMO");
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", promo), awa))
            .andExpect(jsonPath("$.participants", hasSize(2)))
            .andExpect(jsonPath("$.categorie").value("PROMO"))
            .andExpect(jsonPath("$.acces").value("OUVERTE"));
    }

    @Test
    void c02_lArriveeEstAnnonceeSansPastilleNiNotificationEtLHistoriqueNEstPasNonLu() throws Exception {
        Utilisateur awa = alumni("Awa", 1988, null);
        communautes(awa);
        String promo = idCommunaute(awa, "PROMO");
        envoyer(awa, promo, "Bienvenue à tous").andExpect(status().isCreated());

        Utilisateur moussa = alumni("Moussa", 1988, null);
        communautes(moussa).andExpect(jsonPath("$.miennes[0].nombreNonLus").value(0));
        nonLus(moussa).andExpect(jsonPath("$.nombre").value(0));
        nonLus(awa).andExpect(jsonPath("$.nombre").value(0));

        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", promo), awa))
            .andExpect(jsonPath("$.messages", hasSize(3)))
            .andExpect(jsonPath("$.messages[2].systeme").value(true))
            .andExpect(jsonPath("$.messages[2].auteurId").value(moussa.getId().toString()))
            .andExpect(jsonPath("$.messages[1].systeme").value(false));

        // Un vrai message reste un non-lu, mais sans notification dans une communauté.
        envoyer(moussa, promo, "Merci !").andExpect(status().isCreated());
        nonLus(awa).andExpect(jsonPath("$.nombre").value(1));
        org.assertj.core.api.Assertions.assertThat(notifications.countByDestinataire_IdAndLueFalse(awa.getId())).isZero();
    }

    @Test
    void c03_onQuitteSaPromoSansYEtreRemisPuisOnYRevientEtOnChangeDePromoAvecSonProfil() throws Exception {
        Utilisateur awa = alumni("Awa", 1989, null);
        Utilisateur moussa = alumni("Moussa", 1989, null);
        communautes(awa);
        communautes(moussa);
        String promo = idCommunaute(awa, "PROMO");

        // Personne n'en retire un autre : il n'y a pas d'administrateur dans une communauté de promo.
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{autre}", promo, awa.getId()), moussa))
            .andExpect(status().isForbidden());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{moi}", promo, awa.getId()), awa))
            .andExpect(status().isNoContent());

        // Le départ s'affiche dans le fil, et ni l'onglet ni le démarrage de l'API ne la remettent dedans.
        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", promo), moussa))
            // Arrivées d'Awa et de Moussa, puis le départ d'Awa (du plus ancien au plus récent).
            .andExpect(jsonPath("$.messages", hasSize(3)))
            .andExpect(jsonPath("$.messages[2].contenu").value("a quitté la communauté."))
            .andExpect(jsonPath("$.messages[2].auteurId").value(awa.getId().toString()));
        communauteService.synchroniserTous();
        communautes(awa)
            .andExpect(jsonPath("$.miennes", hasSize(0)))
            .andExpect(jsonPath("$.aDecouvrir[0].id").value(promo))
            .andExpect(jsonPath("$.aDecouvrir[0].categorie").value("PROMO"));
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", promo), moussa))
            .andExpect(jsonPath("$.participants", hasSize(1)))
            .andExpect(jsonPath("$.participants[0].roleParticipant").value("MEMBRE"));

        // Elle revient quand elle veut ; un second passage de la synchronisation la garde.
        rejoindre(awa, promo).andExpect(status().isOk());
        communautes(awa).andExpect(jsonPath("$.miennes", hasSize(1))).andExpect(jsonPath("$.aDecouvrir", hasSize(0)));

        awa.setAnneeSortie(1990);
        utilisateurs.saveAndFlush(awa);
        communautes(awa).andExpect(jsonPath("$.miennes", hasSize(1))).andExpect(jsonPath("$.miennes[0].nom").value("Promo 1990"));
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", promo), awa)).andExpect(status().isNotFound());

        // On n'entre pas dans une promo qui n'est pas la sienne.
        Utilisateur fatou = alumni("Fatou", 1991, null);
        rejoindre(fatou, promo).andExpect(status().isConflict());
    }

    @Test
    void c04_unAdministrateurCreeUneCommunauteOuverteQueLesMembresDecouvrentEtRejoignent() throws Exception {
        Utilisateur admin = membre("Admin", TypeRole.ADMIN, null, null);
        Utilisateur awa = alumni("Awa", 1992, null);
        Utilisateur moussa = alumni("Moussa", 1992, null);

        creer(awa, "{\"nom\":\"EPT à Dakar\",\"categorie\":\"VILLE\"}").andExpect(status().isForbidden());
        creer(admin, "{\"nom\":\"Promo bis\",\"categorie\":\"PROMO\"}").andExpect(status().isBadRequest());
        String dakar = JsonPath.read(creer(admin, "{\"nom\":\"EPT à Dakar\",\"description\":\"Afterworks\",\"categorie\":\"VILLE\"}")
            .andExpect(status().isCreated()).andExpect(jsonPath("$.monRole").value("ADMINISTRATEUR"))
            .andReturn().getResponse().getContentAsString(), "$.id");
        String mentors = JsonPath.read(creer(admin, "{\"nom\":\"Mentors EPT\",\"categorie\":\"INTERET\",\"acces\":\"SUR_DEMANDE\"}")
            .andReturn().getResponse().getContentAsString(), "$.id");

        rejoindre(moussa, dakar).andExpect(status().isOk());
        communautes(awa)
            .andExpect(jsonPath("$.aDecouvrir", hasSize(2)))
            .andExpect(jsonPath("$.aDecouvrir[?(@.id == '" + dakar + "')].nombreMembres").value(2))
            .andExpect(jsonPath("$.aDecouvrir[?(@.id == '" + dakar + "')].membresDeMaPromo").value(1));

        rejoindre(awa, mentors).andExpect(status().isConflict());
        rejoindre(awa, dakar).andExpect(status().isOk()).andExpect(jsonPath("$.categorie").value("VILLE"));
        communautes(awa)
            .andExpect(jsonPath("$.miennes[?(@.id == '" + dakar + "')]", hasSize(1)))
            .andExpect(jsonPath("$.aDecouvrir", hasSize(1)));

        // Une communauté ouverte se quitte comme un groupe ; un groupe privé ne se « rejoint » pas.
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{moi}", dakar, awa.getId()), awa))
            .andExpect(status().isNoContent());
        String prive = JsonPath.read(mockMvc.perform(authentifie(post(API + "/conversations/groupes"), moussa)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Amis\"}"))
            .andReturn().getResponse().getContentAsString(), "$.id");
        rejoindre(awa, prive).andExpect(status().isNotFound());
    }

    @Test
    void c06_lAnnuaireDUneCommunauteListeSesMembresVisiblesPourSesSeulsMembres() throws Exception {
        Utilisateur awa = alumni("Awa", 1994, null);
        Utilisateur moussa = alumni("Moussa", 1994, null);
        moussa.setPosteActuel("Ingénieur réseaux");
        moussa.setVilleResidence("Thiès");
        utilisateurs.saveAndFlush(moussa);
        Utilisateur suspendu = alumni("Ibrahima", 1994, null);
        Utilisateur autrePromo = alumni("Fatou", 1995, null);
        for (Utilisateur u : List.of(awa, moussa, suspendu, autrePromo)) communautes(u);
        suspendu.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurs.saveAndFlush(suspendu);
        String promo = idCommunaute(awa, "PROMO");

        // Les comptes visibles de la communauté, triés par nom, au format de l'annuaire.
        membres(awa, promo, null).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.contenu[*].prenom", containsInAnyOrder("Awa", "Moussa")))
            .andExpect(jsonPath("$.contenu[*].anneeSortie", containsInAnyOrder(1994, 1994)));
        membres(awa, promo, "réseaux").andExpect(jsonPath("$.contenu", hasSize(1)))
            .andExpect(jsonPath("$.contenu[0].prenom").value("Moussa"))
            .andExpect(jsonPath("$.contenu[0].villeResidence").value("Thiès"));
        membres(awa, promo, "moussa " + moussa.getNom().toLowerCase()).andExpect(jsonPath("$.contenu", hasSize(1)));
        membres(awa, promo, "100%").andExpect(jsonPath("$.contenu", hasSize(0)));

        // Hors de la communauté, ou pour un groupe privé : introuvable.
        membres(autrePromo, promo, null).andExpect(status().isNotFound());
        String prive = JsonPath.read(mockMvc.perform(authentifie(post(API + "/conversations/groupes"), awa)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Amis\"}"))
            .andReturn().getResponse().getContentAsString(), "$.id");
        membres(awa, prive, null).andExpect(status().isNotFound());
    }

    @Test
    void c05_unVisiteurOuUnCompteSansPromoNAPasDeCommunauteAutomatique() throws Exception {
        Utilisateur visiteur = membre("Visiteur", TypeRole.VISITEUR, 1993, "Génie Civil");
        Utilisateur sansPromo = alumni("Fatou", null, null);
        communautes(visiteur).andExpect(jsonPath("$.miennes", hasSize(0)));
        communautes(sansPromo).andExpect(jsonPath("$.miennes", hasSize(0)));
    }

    private Utilisateur alumni(String prenom, Integer anneeSortie, String filiere) {
        return membre(prenom, TypeRole.ALUMNI, anneeSortie, filiere);
    }

    private Utilisateur membre(String prenom, TypeRole role, Integer anneeSortie, String filiere) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("messagerie-communaute." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom(prenom);
        utilisateur.setNom("Cmt" + UUID.randomUUID().toString().substring(0, 8));
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        utilisateur.setAnneeSortie(anneeSortie);
        utilisateur.setFiliere(filiere);
        return utilisateurs.saveAndFlush(utilisateur);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }

    private ResultActions communautes(Utilisateur moi) throws Exception {
        return mockMvc.perform(authentifie(get(API + "/communautes"), moi));
    }

    private String idCommunaute(Utilisateur moi, String categorie) throws Exception {
        net.minidev.json.JSONArray ids = JsonPath.read(communautes(moi).andReturn().getResponse().getContentAsString(),
            "$.miennes[?(@.categorie == '" + categorie + "')].id");
        return (String) ids.get(0);
    }

    private ResultActions membres(Utilisateur moi, String id, String recherche) throws Exception {
        MockHttpServletRequestBuilder requete = get(API + "/communautes/{id}/membres", id);
        if (recherche != null) requete = requete.param("recherche", recherche);
        return mockMvc.perform(authentifie(requete, moi));
    }

    private ResultActions rejoindre(Utilisateur moi, String id) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/communautes/{id}/rejoindre", id), moi));
    }

    private ResultActions creer(Utilisateur moi, String json) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/communautes"), moi).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions envoyer(Utilisateur moi, String conversationId, String contenu) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/{id}/messages", conversationId), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"contenu\":\"" + contenu + "\"}"));
    }

    private ResultActions nonLus(Utilisateur moi) throws Exception {
        return mockMvc.perform(authentifie(get(API + "/non-lus"), moi));
    }
}
