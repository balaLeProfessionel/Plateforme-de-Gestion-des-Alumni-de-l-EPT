package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.entity.ParticipationEvenement;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Cloche : écrite après le commit, propre à chaque membre, marquée lue une à une ou en bloc. */
@SpringBootTest
@AutoConfigureMockMvc
class NotificationIntegrationTests {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    @Autowired
    private EvenementRepository evenementRepository;
    @Autowired
    private ParticipationEvenementRepository participationRepository;

    private Utilisateur organisateur;
    private Utilisateur participant;
    private Utilisateur absent;

    @BeforeEach
    void preparerComptes() {
        organisateur = creerUtilisateur("Organisateur");
        participant = creerUtilisateur("Participant");
        absent = creerUtilisateur("Absent");
    }

    @Test
    void annulerUnEvenementPrevientSesInscritsSeulement() throws Exception {
        Evenement evenement = creerEvenement();
        participer(evenement, participant, ReponseParticipation.PARTICIPERA);
        participer(evenement, absent, ReponseParticipation.NE_PARTICIPERA_PAS);
        participer(evenement, organisateur, ReponseParticipation.PARTICIPERA);

        mockMvc.perform(authentifie(patch("/api/evenements/{id}/annuler", evenement.getId()), organisateur))
            .andExpect(status().isOk());

        mockMvc.perform(authentifie(get("/api/notifications"), participant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nonLues").value(1))
            .andExpect(jsonPath("$.contenu[0].type").value("EVENEMENT"))
            .andExpect(jsonPath("$.contenu[0].titre").value("Événement annulé : Rencontre des diplômés"))
            .andExpect(jsonPath("$.contenu[0].lien").value("/evenements/" + evenement.getId()))
            .andExpect(jsonPath("$.contenu[0].lue").value(false));
        // Ni ceux qui ont décliné, ni l'auteur de l'annulation.
        mockMvc.perform(authentifie(get("/api/notifications/non-lues"), absent))
            .andExpect(jsonPath("$.nombre").value(0));
        mockMvc.perform(authentifie(get("/api/notifications/non-lues"), organisateur))
            .andExpect(jsonPath("$.nombre").value(0));
    }

    @Test
    void chacunNeMarqueQueSesNotifications() throws Exception {
        Evenement premier = creerEvenement();
        Evenement second = creerEvenement();
        participer(premier, participant, ReponseParticipation.PARTICIPERA);
        participer(second, participant, ReponseParticipation.PARTICIPERA);
        mockMvc.perform(authentifie(patch("/api/evenements/{id}/annuler", premier.getId()), organisateur));
        mockMvc.perform(authentifie(patch("/api/evenements/{id}/annuler", second.getId()), organisateur));

        String page = mockMvc.perform(authentifie(get("/api/notifications"), participant))
            .andExpect(jsonPath("$.nonLues").value(2))
            .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(page, "$.contenu[0].id");

        mockMvc.perform(authentifie(post("/api/notifications/{id}/lue", id), absent))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(post("/api/notifications/{id}/lue", id), participant))
            .andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get("/api/notifications/non-lues"), participant))
            .andExpect(jsonPath("$.nombre").value(1));
        mockMvc.perform(authentifie(get("/api/notifications").param("nonLues", "true"), participant))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].lue").value(false));

        mockMvc.perform(authentifie(post("/api/notifications/lues"), participant))
            .andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get("/api/notifications"), participant))
            .andExpect(jsonPath("$.nonLues").value(0))
            .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void exigeUneSessionEtValideLaPagination() throws Exception {
        mockMvc.perform(get("/api/notifications")).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/notifications").param("taille", "51"), participant))
            .andExpect(status().isBadRequest());
    }

    private Utilisateur creerUtilisateur(String nom) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("notification." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom("Membre");
        utilisateur.setNom(nom);
        utilisateur.setTelephone("+221700000000");
        utilisateur.setRole(TypeRole.ALUMNI);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    private Evenement creerEvenement() {
        Instant debut = Instant.now().plusSeconds(86_400);
        Evenement evenement = new Evenement();
        evenement.setTitre("Rencontre des diplômés");
        evenement.setDescription("Un événement de test.");
        evenement.setLieu("Thiès");
        evenement.setDateDebut(debut);
        evenement.setDateFin(debut.plusSeconds(3600));
        evenement.setAudience(AudienceEvenement.TOUS);
        evenement.setStatut(StatutEvenement.PUBLIE);
        evenement.setOrganisateur(organisateur);
        return evenementRepository.saveAndFlush(evenement);
    }

    private void participer(Evenement evenement, Utilisateur utilisateur, ReponseParticipation reponse) {
        ParticipationEvenement participation = new ParticipationEvenement();
        participation.setEvenement(evenement);
        participation.setUtilisateur(utilisateur);
        participation.setReponse(reponse);
        participationRepository.saveAndFlush(participation);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
