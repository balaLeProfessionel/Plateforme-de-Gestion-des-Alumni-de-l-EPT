package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
    private static final String ADMIN = "/api/admin/communautes";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private ConversationRepository conversations;
    @Autowired private ParticipantRepository participants;
    @Autowired private MessageRepository messages;
    @Autowired private NotificationRepository notifications;
    @Autowired private ept.edu.sn.alumni_backend.messagerie.service.CommunauteService communauteService;
    @Autowired private ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository filiereRepository;

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
        // L'administrateur de la plateforme n'en devient pas membre : la communauté part vide.
        String dakar = JsonPath.read(creer(admin, "{\"nom\":\"EPT à Dakar\",\"description\":\"Afterworks\",\"categorie\":\"VILLE\"}")
            .andExpect(status().isCreated()).andExpect(jsonPath("$.nombreMembres").value(0))
            .andExpect(jsonPath("$.acces").value("OUVERTE"))
            .andReturn().getResponse().getContentAsString(), "$.id");
        org.assertj.core.api.Assertions.assertThat(participants.existsByConversationIdAndUtilisateurId(
            UUID.fromString(dakar), admin.getId())).isFalse();
        String mentors = JsonPath.read(creer(admin, "{\"nom\":\"Mentors EPT\",\"categorie\":\"INTERET\",\"acces\":\"SUR_DEMANDE\"}")
            .andReturn().getResponse().getContentAsString(), "$.id");

        rejoindre(moussa, dakar).andExpect(status().isOk());
        communautes(awa)
            .andExpect(jsonPath("$.aDecouvrir", hasSize(2)))
            .andExpect(jsonPath("$.aDecouvrir[?(@.id == '" + dakar + "')].nombreMembres").value(1))
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

    @Test
    void c07_lesCommunautesSontReserveesAuxAlumniEtAuxEtudiants() throws Exception {
        Utilisateur admin = membre("Admin", TypeRole.ADMIN, null, null);
        Utilisateur personnel = membre("Saliou", TypeRole.PERSONNEL, 2001, "Génie Civil");
        Utilisateur etudiant = membre("Codou", TypeRole.ETUDIANT, 2028, null);
        String dakar = JsonPath.read(creer(admin, "{\"nom\":\"EPT à Dakar\",\"categorie\":\"VILLE\"}")
            .andReturn().getResponse().getContentAsString(), "$.id");

        // Ni onglet garni ni adhésion pour le personnel (pas même sa promo d'ancien élève).
        communautes(personnel).andExpect(status().isOk())
            .andExpect(jsonPath("$.miennes", hasSize(0))).andExpect(jsonPath("$.aDecouvrir", hasSize(0)));
        rejoindre(personnel, dakar).andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Les communautés sont réservées aux alumni et aux étudiants."));

        // L'administrateur d'une communauté modère, mais n'y fait entrer personne et ne nomme pas d'autre administrateur :
        // on la rejoint soi-même, selon son mode d'accès.
        Utilisateur responsable = alumni("Awa", 1990, null);
        rejoindre(responsable, dakar).andExpect(status().isOk());
        participants.findByConversationIdAndUtilisateurId(UUID.fromString(dakar), responsable.getId()).ifPresent(p -> {
            p.setRole(ept.edu.sn.alumni_backend.messagerie.RoleParticipant.ADMINISTRATEUR);
            participants.saveAndFlush(p);
        });
        for (Utilisateur ajoute : List.of(personnel, etudiant)) {
            mockMvc.perform(authentifie(post(API + "/conversations/{id}/participants", dakar), responsable)
                .contentType(MediaType.APPLICATION_JSON).content("{\"membreIds\":[\"" + ajoute.getId() + "\"]}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("On rejoint une communauté soi-même, depuis « À découvrir »."));
        }
        rejoindre(etudiant, dakar).andExpect(status().isOk());
        mockMvc.perform(authentifie(patch(API + "/conversations/{id}/participants/{membre}", dakar, etudiant.getId()), responsable)
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMINISTRATEUR\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Les administrateurs d'une communauté sont désignés par l'administration de la plateforme."));
        // Modérer reste possible : retirer un membre.
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{membre}", dakar, etudiant.getId()), responsable))
            .andExpect(status().isNoContent());
        rejoindre(etudiant, dakar).andExpect(status().isOk());

        // Un groupe privé, lui, reste ouvert à tous les rôles.
        String prive = JsonPath.read(mockMvc.perform(authentifie(post(API + "/conversations/groupes"), etudiant)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Projet\",\"membreIds\":[\"" + personnel.getId() + "\"]}"))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        org.assertj.core.api.Assertions.assertThat(participants.existsByConversationIdAndUtilisateurId(
            UUID.fromString(prive), personnel.getId())).isTrue();
    }

    @Test
    void c08_lAdministrationListeCreeEtModifieLesCommunautesSansEnEtreMembre() throws Exception {
        Utilisateur admin = membre("Admin", TypeRole.ADMIN, null, null);
        // Un administrateur à qui cette responsabilité n'a pas été confiée n'y a pas accès.
        Utilisateur autreAdmin = membre("Autre", TypeRole.ADMIN, null, null);
        autreAdmin.getPermissionsAdmin().clear();
        utilisateurs.saveAndFlush(autreAdmin);
        mockMvc.perform(authentifie(get(ADMIN), autreAdmin)).andExpect(status().isForbidden());
        Utilisateur awa = alumni("Awa", 1996, "Génie Civil");
        communautes(awa);
        String promo = idCommunaute(awa, "PROMO");
        String thies = JsonPath.read(creer(admin, "{\"nom\":\"EPT à Thiès\",\"categorie\":\"VILLE\"}")
            .andReturn().getResponse().getContentAsString(), "$.id");
        creer(admin, "{\"nom\":\"Énergie solaire\",\"categorie\":\"SECTEUR\",\"acces\":\"SUR_DEMANDE\"}");
        rejoindre(awa, thies).andExpect(status().isOk());

        // Toutes les communautés, filtrées par catégorie et par nom (sans accents ni majuscules), avec leurs membres.
        mockMvc.perform(authentifie(get(ADMIN), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[*].nom", org.hamcrest.Matchers.hasItems("EPT à Thiès", "Énergie solaire", "Promo 1996")));
        mockMvc.perform(authentifie(get(ADMIN).param("recherche", "THIES"), admin))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].nombreMembres").value(1))
            .andExpect(jsonPath("$.contenu[0].automatique").value(false));
        mockMvc.perform(authentifie(get(ADMIN).param("recherche", "energie"), admin))
            .andExpect(jsonPath("$.contenu[0].acces").value("SUR_DEMANDE"));
        mockMvc.perform(authentifie(get(ADMIN).param("categorie", "PROMO"), admin))
            .andExpect(jsonPath("$.contenu[*].categorie", org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("PROMO"))));
        mockMvc.perform(authentifie(get(ADMIN), awa)).andExpect(status().isForbidden());

        // Nom, description, accès ; la description vide s'efface ; un membre voit le nouveau nom.
        modifier(admin, thies, "{\"nom\":\" Alumni EPT à Thiès \",\"description\":\"Rencontres mensuelles\",\"acces\":\"SUR_DEMANDE\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nom").value("Alumni EPT à Thiès"))
            .andExpect(jsonPath("$.description").value("Rencontres mensuelles"))
            .andExpect(jsonPath("$.acces").value("SUR_DEMANDE"));
        modifier(admin, thies, "{\"description\":\"  \"}").andExpect(jsonPath("$.description").value(org.hamcrest.Matchers.nullValue()));
        mockMvc.perform(authentifie(get(API + "/conversations/{id}", thies), awa))
            .andExpect(jsonPath("$.nom").value("Alumni EPT à Thiès"));
        modifier(admin, thies, "{\"nom\":\"  \"}").andExpect(status().isBadRequest());
        modifier(admin, thies, "{}").andExpect(status().isBadRequest());
        modifier(awa, thies, "{\"nom\":\"Piratage\"}").andExpect(status().isForbidden());

        // Une promo : description seulement ; son nom et son accès suivent les profils.
        modifier(admin, promo, "{\"description\":\"Les ingénieurs sortis en 1996.\"}").andExpect(status().isOk())
            .andExpect(jsonPath("$.automatique").value(true));
        modifier(admin, promo, "{\"nom\":\"Promo renommée\"}").andExpect(status().isBadRequest());
        modifier(admin, promo, "{\"acces\":\"SUR_DEMANDE\"}").andExpect(status().isBadRequest());
        modifier(admin, promo, "{\"nom\":\"Promo 1996\"}").andExpect(status().isOk());

        // Deux communautés ne portent pas le même nom (majuscules comprises) ; garder son propre nom reste permis.
        creer(admin, "{\"nom\":\"alumni ept à thiès\",\"categorie\":\"INTERET\"}").andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Une communauté porte déjà le nom « alumni ept à thiès »."));
        String solaire = JsonPath.read(mockMvc.perform(authentifie(get(ADMIN).param("recherche", "energie"), admin))
            .andReturn().getResponse().getContentAsString(), "$.contenu[0].id");
        modifier(admin, solaire, "{\"nom\":\"Promo 1996\"}").andExpect(status().isConflict());
        modifier(admin, thies, "{\"nom\":\"ALUMNI EPT à Thiès\"}").andExpect(status().isOk());

        // Les filtres affichent le nombre de communautés de chaque catégorie, 0 compris.
        mockMvc.perform(authentifie(get(ADMIN + "/resume"), admin)).andExpect(status().isOk())
            .andExpect(jsonPath("$.parCategorie.VILLE").value(1))
            .andExpect(jsonPath("$.parCategorie.SECTEUR").value(1))
            .andExpect(jsonPath("$.parCategorie.INTERET").value(0))
            .andExpect(jsonPath("$.parCategorie.PROMO").value(1))
            .andExpect(jsonPath("$.total").value(5));
        mockMvc.perform(authentifie(get(ADMIN + "/resume"), awa)).andExpect(status().isForbidden());

        // Un groupe privé n'est pas une communauté : introuvable pour l'administration.
        String prive = JsonPath.read(mockMvc.perform(authentifie(post(API + "/conversations/groupes"), awa)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Amis\"}"))
            .andReturn().getResponse().getContentAsString(), "$.id");
        modifier(admin, prive, "{\"nom\":\"Autre\"}").andExpect(status().isNotFound());
    }

    @Test
    void c09_unMembreNeDevientPasAdministrateurDUneCommunauteNiNeLaRenommeOuLaSupprime() throws Exception {
        Utilisateur admin = membre("Admin", TypeRole.ADMIN, null, null);
        Utilisateur awa = alumni("Awa", 1990, null);
        Utilisateur moussa = alumni("Moussa", 2005, null);
        String kaolack = JsonPath.read(creer(admin, "{\"nom\":\"EPT à Kaolack\",\"categorie\":\"VILLE\"}")
            .andReturn().getResponse().getContentAsString(), "$.id");
        rejoindre(awa, kaolack).andExpect(status().isOk());
        rejoindre(moussa, kaolack).andExpect(status().isOk());

        // Un départ ne fait pas du plus ancien membre restant l'administrateur de la communauté.
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/participants/{membre}", kaolack, awa.getId()), awa))
            .andExpect(status().isNoContent());
        org.assertj.core.api.Assertions.assertThat(participants.findByConversationIdAndUtilisateurId(
            UUID.fromString(kaolack), moussa.getId()).orElseThrow().getRole())
            .isEqualTo(ept.edu.sn.alumni_backend.messagerie.RoleParticipant.MEMBRE);
        mockMvc.perform(authentifie(patch(API + "/conversations/{id}", kaolack), moussa)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Pris\"}")).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}", kaolack), moussa)).andExpect(status().isForbidden());

        // Même nommé administrateur de la communauté, un membre ne la renomme ni ne la supprime : c'est l'administration.
        participants.findByConversationIdAndUtilisateurId(UUID.fromString(kaolack), moussa.getId()).ifPresent(p -> {
            p.setRole(ept.edu.sn.alumni_backend.messagerie.RoleParticipant.ADMINISTRATEUR);
            participants.saveAndFlush(p);
        });
        mockMvc.perform(authentifie(patch(API + "/conversations/{id}", kaolack), moussa)
            .contentType(MediaType.APPLICATION_JSON).content("{\"nom\":\"Pris\"}")).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(delete(API + "/conversations/{id}", kaolack), moussa)).andExpect(status().isForbidden());
        org.assertj.core.api.Assertions.assertThat(conversations.findById(UUID.fromString(kaolack)).orElseThrow().getNom())
            .isEqualTo("EPT à Kaolack");
    }

    @Test
    void c10_uneRequeteMalFormeeEstRefuseeClairementSansDetailInterne() throws Exception {
        Utilisateur admin = membre("Admin", TypeRole.ADMIN, null, null);
        mockMvc.perform(authentifie(get(ADMIN).param("categorie", "PIRATE"), admin)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le paramètre « categorie » est invalide."));
        modifier(admin, "abc", "{\"description\":\"x\"}").andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le paramètre « id » est invalide."));
        creer(admin, "{\"nom\":\"x\",\"categorie\":").andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le contenu de la requête est illisible ou mal formé."));
        creer(admin, "{\"nom\":\"x\",\"categorie\":\"VILLE\",\"acces\":\"PUBLIQUE\"}").andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(post(ADMIN), admin).contentType(MediaType.APPLICATION_XML).content("<nom>x</nom>"))
            .andExpect(status().isUnsupportedMediaType());
        mockMvc.perform(authentifie(delete(ADMIN), admin)).andExpect(status().isMethodNotAllowed());
        // Bornes des paramètres et paramètre manquant : le paramètre est nommé, jamais la méthode Java.
        mockMvc.perform(authentifie(get(ADMIN).param("taille", "49"), admin)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le paramètre « taille » est invalide."));
        Utilisateur awa = alumni("Awa", 1990, null);
        mockMvc.perform(authentifie(get(API + "/communautes/decouvrir"), awa)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le paramètre « recherche » est obligatoire."));
        decouvrir(awa, "a".repeat(101)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le paramètre « recherche » est invalide."));
    }

    @Test
    void c11_laRechercheTrouveUneCommunauteARejoindreAuDelaDesTrentePremieres() throws Exception {
        Utilisateur admin = membre("Admin", TypeRole.ADMIN, null, null);
        Utilisateur awa = alumni("Awa", 1990, null);
        Utilisateur personnel = membre("Saliou", TypeRole.PERSONNEL, null, null);
        String ziguinchor = JsonPath.read(creer(admin,
            "{\"nom\":\"EPT à Ziguinchor\",\"categorie\":\"VILLE\",\"description\":\"Les alumni de Casamance\"}")
            .andReturn().getResponse().getContentAsString(), "$.id");
        // Trente communautés plus actives la repoussent hors de « À découvrir ».
        for (int i = 0; i < 30; i++) {
            creer(admin, "{\"nom\":\"Club " + i + "\",\"categorie\":\"INTERET\"}").andExpect(status().isCreated());
        }
        communautes(awa).andExpect(jsonPath("$.aDecouvrir", hasSize(30)))
            .andExpect(jsonPath("$.aDecouvrir[?(@.id == '" + ziguinchor + "')]", hasSize(0)));

        decouvrir(awa, "ept a ZIGUINCHÔR").andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(ziguinchor))
            .andExpect(jsonPath("$[0].nombreMembres").value(0));
        decouvrir(awa, "casamance").andExpect(jsonPath("$[0].id").value(ziguinchor));
        decouvrir(awa, "%").andExpect(jsonPath("$", hasSize(0)));
        decouvrir(awa, "club").andExpect(jsonPath("$", hasSize(30)));
        decouvrir(awa, "   ").andExpect(status().isBadRequest());
        decouvrir(personnel, "ziguinchor").andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));

        // Une fois rejointe, elle quitte les résultats.
        rejoindre(awa, ziguinchor).andExpect(status().isOk());
        decouvrir(awa, "ziguinchor").andExpect(jsonPath("$", hasSize(0)));
    }

    private ResultActions decouvrir(Utilisateur moi, String recherche) throws Exception {
        return mockMvc.perform(authentifie(get(API + "/communautes/decouvrir").param("recherche", recherche), moi));
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
        utilisateur.setFiliere(filiere == null ? null : FilieresDeTest.filiere(filiereRepository, filiere));
        // Un compte d'administration n'a que les responsabilités cochées pour lui : ici, les communautés.
        if (role == TypeRole.ADMIN) utilisateur.getPermissionsAdmin().add(ept.edu.sn.alumni_backend.admin.PermissionAdmin.GERER_COMMUNAUTES);
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
        return mockMvc.perform(authentifie(post(ADMIN), moi).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions modifier(Utilisateur moi, String id, String json) throws Exception {
        return mockMvc.perform(authentifie(patch(ADMIN + "/{id}", id), moi).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions envoyer(Utilisateur moi, String conversationId, String contenu) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/{id}/messages", conversationId), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"contenu\":\"" + contenu + "\"}"));
    }

    private ResultActions nonLus(Utilisateur moi) throws Exception {
        return mockMvc.perform(authentifie(get(API + "/non-lus"), moi));
    }
}
