package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.entity.ParticipationEvenement;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
class EvenementParticipationIntegrationTests {
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
    private Utilisateur alumni;
    private Utilisateur autreAlumni;
    private Utilisateur admin;

    @BeforeEach
    void preparerComptes() {
        organisateur = creerUtilisateur(TypeRole.ALUMNI, "Organisateur");
        alumni = creerUtilisateur(TypeRole.ALUMNI, "Awa");
        autreAlumni = creerUtilisateur(TypeRole.ALUMNI, "Moussa");
        admin = creerUtilisateur(TypeRole.ADMIN, "Admin");
    }

    @Test
    void unePersonnePeutChangerSaReponseSansCreerDeDoublon() throws Exception {
        Evenement evenement = creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, null, false);

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.maReponse").value("PARTICIPERA"))
            .andExpect(jsonPath("$.nombreParticipants").value(1));

        UUID idInitial = participationRepository
            .findByEvenement_IdAndUtilisateur_Id(evenement.getId(), alumni.getId())
            .orElseThrow().getId();

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"NE_PARTICIPERA_PAS\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.maReponse").value("NE_PARTICIPERA_PAS"))
            .andExpect(jsonPath("$.nombreParticipants").value(0));

        UUID idApresModification = participationRepository
            .findByEvenement_IdAndUtilisateur_Id(evenement.getId(), alumni.getId())
            .orElseThrow().getId();
        assertEquals(idInitial, idApresModification);
        assertEquals(0, participationRepository.countByEvenement_IdAndReponse(
            evenement.getId(), ReponseParticipation.PARTICIPERA));
    }

    @Test
    void capaciteBloqueLesNouvellesReponsesPositivesMaisPermetDeLibérerUnePlace() throws Exception {
        Evenement evenement = creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, 1, false);

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isOk());

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), autreAlumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Cet événement a atteint sa capacité maximale."));

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"NE_PARTICIPERA_PAS\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nombreParticipants").value(0));

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), autreAlumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nombreParticipants").value(1));

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), autreAlumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nombreParticipants").value(1));
    }

    @Test
    void seulsOrganisateurEtAdminPeuventVoirLesParticipantsPositifs() throws Exception {
        Evenement evenement = creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, null, false);
        creerParticipation(evenement, alumni, ReponseParticipation.PARTICIPERA);
        creerParticipation(evenement, autreAlumni, ReponseParticipation.NE_PARTICIPERA_PAS);

        mockMvc.perform(requeteAuthentifie(get("/api/evenements/{id}/participants", evenement.getId()), alumni))
            .andExpect(status().isNotFound());

        mockMvc.perform(requeteAuthentifie(get("/api/evenements/{id}/participants", evenement.getId()), organisateur))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].nom").value("Awa"))
            .andExpect(jsonPath("$.contenu[0].role").value("ALUMNI"))
            .andExpect(jsonPath("$.contenu[0].email").doesNotExist())
            .andExpect(jsonPath("$.contenu[0].telephone").doesNotExist());

        mockMvc.perform(requeteAuthentifie(get("/api/evenements/{id}/participants", evenement.getId()), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void refuseLesReponsesHorsAudienceEtPourLesEvenementsTerminesOuAnnules() throws Exception {
        Evenement etudiants = creerEvenement(AudienceEvenement.ETUDIANTS, StatutEvenement.PUBLIE, null, false);
        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", etudiants.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isNotFound());
        assertTrue(participationRepository.findByEvenement_IdAndUtilisateur_Id(etudiants.getId(), alumni.getId())
            .isEmpty());

        Utilisateur etudiant = creerUtilisateur(TypeRole.ETUDIANT, "Étudiant");
        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", etudiants.getId()), etudiant)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isOk());

        Evenement annule = creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.ANNULE, null, false);
        Evenement passe = creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, null, true);
        for (Evenement indisponible : new Evenement[] {annule, passe}) {
            mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", indisponible.getId()), alumni)
                    .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
                .andExpect(status().isNotFound());
        }

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", etudiants.getId()), admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"PARTICIPERA\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void valideLaReponseEtLaPaginationEtExigeUneSession() throws Exception {
        Evenement evenement = creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, null, false);

        mockMvc.perform(put("/api/evenements/{id}/participation", evenement.getId())
                .contentType(MediaType.APPLICATION_JSON).content("{\"reponse\":\"AUTRE\"}"))
            .andExpect(status().isForbidden());
        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}/participation", evenement.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
        mockMvc.perform(requeteAuthentifie(get("/api/evenements/{id}/participants", evenement.getId())
                .param("taille", "49"), organisateur))
            .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/evenements/{id}/participants", evenement.getId()))
            .andExpect(status().isForbidden());
    }

    @Test
    void demandesSimultaneesNeDepassentPasLaCapacite() throws Exception {
        Evenement evenement = creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, 1, false);
        CountDownLatch demandesPretes = new CountDownLatch(2);
        CountDownLatch depart = new CountDownLatch(1);
        ExecutorService executants = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> premiere = executants.submit(() -> envoyerReponseSimultanee(
                evenement.getId(), alumni, demandesPretes, depart));
            Future<Integer> seconde = executants.submit(() -> envoyerReponseSimultanee(
                evenement.getId(), autreAlumni, demandesPretes, depart));

            assertTrue(demandesPretes.await(5, TimeUnit.SECONDS));
            depart.countDown();
            int statutPremier = premiere.get(15, TimeUnit.SECONDS);
            int statutSecond = seconde.get(15, TimeUnit.SECONDS);

            assertNotEquals(statutPremier, statutSecond);
            assertTrue((statutPremier == 200 && statutSecond == 409)
                || (statutPremier == 409 && statutSecond == 200));
            assertEquals(1, participationRepository.countByEvenement_IdAndReponse(
                evenement.getId(), ReponseParticipation.PARTICIPERA));
        } finally {
            depart.countDown();
            executants.shutdownNow();
        }
    }

    private int envoyerReponseSimultanee(
            UUID evenementId,
            Utilisateur participant,
            CountDownLatch demandesPretes,
            CountDownLatch depart) throws Exception {
        demandesPretes.countDown();
        assertTrue(depart.await(5, TimeUnit.SECONDS));
        MvcResult resultat = mockMvc.perform(requeteAuthentifie(
                put("/api/evenements/{id}/participation", evenementId), participant)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reponse\":\"PARTICIPERA\"}"))
            .andReturn();
        return resultat.getResponse().getStatus();
    }

    private Utilisateur creerUtilisateur(TypeRole role, String nom) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("participation." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom("Membre");
        utilisateur.setNom(nom);
        utilisateur.setTelephone("+221700000000");
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    private Evenement creerEvenement(
            AudienceEvenement audience,
            StatutEvenement statut,
            Integer nombrePlaces,
            boolean passe) {
        Instant debut = passe ? Instant.now().minusSeconds(7200) : Instant.now().plusSeconds(3600);
        Evenement evenement = new Evenement();
        evenement.setTitre("Rencontre de la communauté");
        evenement.setDescription("Un événement de test.");
        evenement.setLieu("Thiès");
        evenement.setDateDebut(debut);
        evenement.setDateFin(passe ? debut.plusSeconds(1800) : debut.plusSeconds(3600));
        evenement.setAudience(audience);
        evenement.setStatut(statut);
        evenement.setNombrePlaces(nombrePlaces);
        evenement.setOrganisateur(organisateur);
        return evenementRepository.saveAndFlush(evenement);
    }

    private void creerParticipation(Evenement evenement, Utilisateur utilisateur, ReponseParticipation reponse) {
        ParticipationEvenement participation = new ParticipationEvenement();
        participation.setEvenement(evenement);
        participation.setUtilisateur(utilisateur);
        participation.setReponse(reponse);
        participationRepository.saveAndFlush(participation);
    }

    private MockHttpServletRequestBuilder requeteAuthentifie(
            MockHttpServletRequestBuilder requete,
            Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
