package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.dto.EvenementRequest;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = "app.evenements.limite-creations-24h=10")
class EvenementGestionIntegrationTests {
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

    private Utilisateur alumni;
    private Utilisateur autreAlumni;
    private Utilisateur admin;

    @BeforeEach
    void preparerComptes() {
        alumni = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, true);
        autreAlumni = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, true);
        admin = creerUtilisateur(TypeRole.ADMIN, StatutCompte.ACTIF, true);
    }

    @Test
    void tousLesRolesAuthentifiesPeuventCreerUnEvenement() throws Exception {
        for (TypeRole role : TypeRole.values()) {
            Utilisateur createur = creerUtilisateur(role, StatutCompte.ACTIF, true);

            mockMvc.perform(requeteAuthentifie(post("/api/evenements"), createur)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(corps(requeteValide())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.organisateurId").value(createur.getId().toString()))
                .andExpect(jsonPath("$.officielEpt").value(false))
                .andExpect(jsonPath("$.statut").value("PUBLIE"));
        }
    }

    @Test
    void compteEnAttenteVerifiePeutCreerUnEvenement() throws Exception {
        Utilisateur enAttente = creerUtilisateur(TypeRole.VISITEUR, StatutCompte.EN_ATTENTE, true);

        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), enAttente)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps(requeteValide())))
            .andExpect(status().isCreated());
    }

    @Test
    void limiteLesCreationsParCompteSur24HeuresSansBloquerLesAutresComptes() throws Exception {
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(corps(requeteValide("Rencontre " + i, AudienceEvenement.TOUS))))
                .andExpect(status().isCreated());
        }

        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps(requeteValide())))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.message").exists());

        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), autreAlumni)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps(requeteValide())))
            .andExpect(status().isCreated());
    }

    @Test
    void refuseCreationSansSessionPourCompteNonVerifieOuSuspendu() throws Exception {
        String corps = corps(requeteValide());
        mockMvc.perform(post("/api/evenements")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps))
            .andExpect(status().isForbidden());

        Utilisateur nonVerifie = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, false);
        Utilisateur suspendu = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.SUSPENDU, true);
        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), nonVerifie)
                .contentType(MediaType.APPLICATION_JSON).content(corps))
            .andExpect(status().isForbidden());
        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), suspendu)
                .contentType(MediaType.APPLICATION_JSON).content(corps))
            .andExpect(status().isForbidden());
    }

    @Test
    void respecteLeChangementObligatoireDuMotDePasseAvantCreation() throws Exception {
        alumni.setDoitChangerMotDePasse(true);
        utilisateurRepository.saveAndFlush(alumni);

        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps(requeteValide())))
            .andExpect(status().isForbidden());
    }

    @Test
    void valideLesChampsObligatoiresLesDatesEtLaCapacite() throws Exception {
        EvenementRequest champsVides = new EvenementRequest(
            " ", "Description", "Thiès", Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200), AudienceEvenement.TOUS, null);
        EvenementRequest datesInvalides = new EvenementRequest(
            "Titre", "Description", "Thiès", Instant.now().plusSeconds(7200),
            Instant.now().plusSeconds(3600), AudienceEvenement.TOUS, null);
        EvenementRequest capaciteInvalide = new EvenementRequest(
            "Titre", "Description", "Thiès", Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200), AudienceEvenement.TOUS, 0);
        EvenementRequest descriptionVide = new EvenementRequest(
            "Titre", " ", "Thiès", Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200), AudienceEvenement.TOUS, null);
        EvenementRequest lieuVide = new EvenementRequest(
            "Titre", "Description", " ", Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200), AudienceEvenement.TOUS, null);
        EvenementRequest titreTropLong = new EvenementRequest(
            "T".repeat(121), "Description", "Thiès", Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200), AudienceEvenement.TOUS, null);
        EvenementRequest descriptionTropLongue = new EvenementRequest(
            "Titre", "D".repeat(5001), "Thiès", Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200), AudienceEvenement.TOUS, null);
        EvenementRequest lieuTropLong = new EvenementRequest(
            "Titre", "Description", "L".repeat(201), Instant.now().plusSeconds(3600),
            Instant.now().plusSeconds(7200), AudienceEvenement.TOUS, null);

        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                .contentType(MediaType.APPLICATION_JSON).content(corps(champsVides)))
            .andExpect(status().isBadRequest());
        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                .contentType(MediaType.APPLICATION_JSON).content(corps(datesInvalides)))
            .andExpect(status().isBadRequest());
        mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                .contentType(MediaType.APPLICATION_JSON).content(corps(capaciteInvalide)))
            .andExpect(status().isBadRequest());
        for (EvenementRequest invalide : new EvenementRequest[] {
                descriptionVide, lieuVide, titreTropLong, descriptionTropLongue, lieuTropLong}) {
            mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                    .contentType(MediaType.APPLICATION_JSON).content(corps(invalide)))
                .andExpect(status().isBadRequest());
        }
    }

    @Test
    void ignoreLesTentativesDeFalsificationDuCreateurDuStatutEtDuCaractereOfficiel() throws Exception {
        String contenu = """
            {
              "titre":"Rencontre EPT",
              "description":"Description valide",
              "lieu":"Thiès",
              "dateDebut":"%s",
              "dateFin":"%s",
              "audience":"TOUS",
              "organisateurId":"%s",
              "officielEpt":true,
              "statut":"ANNULE"
            }
            """.formatted(
                Instant.now().plusSeconds(3600),
                Instant.now().plusSeconds(7200),
                autreAlumni.getId());

        var resultat = mockMvc.perform(requeteAuthentifie(post("/api/evenements"), alumni)
                .contentType(MediaType.APPLICATION_JSON).content(contenu))
            .andReturn();

        int code = resultat.getResponse().getStatus();
        org.junit.jupiter.api.Assertions.assertTrue(code == 201 || code == 400);
        if (code == 201) {
            jsonPath("$.organisateurId").value(alumni.getId().toString()).match(resultat);
            jsonPath("$.officielEpt").value(false).match(resultat);
            jsonPath("$.statut").value("PUBLIE").match(resultat);
        } else {
            org.junit.jupiter.api.Assertions.assertEquals(0, evenementRepository.count());
        }
    }

    @Test
    void organisateurPeutModifierSonEvenementSansToucherAuxChampsProteges() throws Exception {
        Evenement evenement = creerEvenement(alumni);
        evenement.setOfficielEpt(true);
        evenementRepository.saveAndFlush(evenement);

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}", evenement.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps(requeteValide("Titre modifié", AudienceEvenement.ALUMNI))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.titre").value("Titre modifié"))
            .andExpect(jsonPath("$.audience").value("ALUMNI"))
            .andExpect(jsonPath("$.organisateurId").value(alumni.getId().toString()))
            .andExpect(jsonPath("$.officielEpt").value(true));
    }

    @Test
    void unAutreMembreNePeutNiModifierNiAnnulerLevenement() throws Exception {
        Evenement evenement = creerEvenement(alumni);

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}", evenement.getId()), autreAlumni)
                .contentType(MediaType.APPLICATION_JSON).content(corps(requeteValide())))
            .andExpect(status().isNotFound());
        mockMvc.perform(requeteAuthentifie(patch("/api/evenements/{id}/annuler", evenement.getId()), autreAlumni))
            .andExpect(status().isNotFound());

        org.junit.jupiter.api.Assertions.assertEquals(
            StatutEvenement.PUBLIE,
            evenementRepository.findById(evenement.getId()).orElseThrow().getStatut());
    }

    @Test
    void adminPeutGererUnEvenementEtLannulationConserveLesParticipations() throws Exception {
        Evenement evenement = creerEvenement(alumni);
        Utilisateur participant = creerUtilisateur(TypeRole.PERSONNEL, StatutCompte.ACTIF, true);
        creerParticipation(evenement, participant);

        mockMvc.perform(requeteAuthentifie(put("/api/evenements/{id}", evenement.getId()), admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps(requeteValide("Titre administré", AudienceEvenement.TOUS))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.titre").value("Titre administré"));

        mockMvc.perform(requeteAuthentifie(patch("/api/evenements/{id}/annuler", evenement.getId()), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ANNULE"))
            .andExpect(jsonPath("$.nombreParticipants").value(1));

        org.junit.jupiter.api.Assertions.assertTrue(evenementRepository.existsById(evenement.getId()));
        org.junit.jupiter.api.Assertions.assertEquals(1, participationRepository.countByEvenement_IdAndReponse(
            evenement.getId(), ReponseParticipation.PARTICIPERA));
    }

    @Test
    void seulAdminPeutDefinirOuRetirerLeCaractereOfficiel() throws Exception {
        Evenement evenement = creerEvenement(alumni);
        String vrai = "{\"officielEpt\":true}";
        String faux = "{\"officielEpt\":false}";

        mockMvc.perform(requeteAuthentifie(patch("/api/evenements/{id}/officiel", evenement.getId()), alumni)
                .contentType(MediaType.APPLICATION_JSON).content(vrai))
            .andExpect(status().isForbidden());

        mockMvc.perform(requeteAuthentifie(patch("/api/evenements/{id}/officiel", evenement.getId()), admin)
                .contentType(MediaType.APPLICATION_JSON).content(vrai))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.officielEpt").value(true));
        mockMvc.perform(requeteAuthentifie(patch("/api/evenements/{id}/officiel", evenement.getId()), admin)
                .contentType(MediaType.APPLICATION_JSON).content(faux))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.officielEpt").value(false));
    }

    private Utilisateur creerUtilisateur(TypeRole role, StatutCompte statut, boolean emailVerifie) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("gestion.evenement." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom("Membre");
        utilisateur.setNom(role.name());
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(emailVerifie);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    private Evenement creerEvenement(Utilisateur organisateur) {
        Instant debut = Instant.now().plusSeconds(3600);
        Evenement evenement = new Evenement();
        evenement.setTitre("Rencontre de la communauté");
        evenement.setDescription("Un événement de test.");
        evenement.setLieu("Thiès");
        evenement.setDateDebut(debut);
        evenement.setDateFin(debut.plusSeconds(3600));
        evenement.setAudience(AudienceEvenement.TOUS);
        evenement.setOrganisateur(organisateur);
        return evenementRepository.saveAndFlush(evenement);
    }

    private void creerParticipation(Evenement evenement, Utilisateur utilisateur) {
        ParticipationEvenement participation = new ParticipationEvenement();
        participation.setEvenement(evenement);
        participation.setUtilisateur(utilisateur);
        participation.setReponse(ReponseParticipation.PARTICIPERA);
        participationRepository.saveAndFlush(participation);
    }

    private EvenementRequest requeteValide() {
        return requeteValide("Rencontre de la communauté", AudienceEvenement.TOUS);
    }

    private EvenementRequest requeteValide(String titre, AudienceEvenement audience) {
        Instant debut = Instant.now().plusSeconds(3600);
        return new EvenementRequest(titre, "Description de la rencontre", "Thiès", debut,
            debut.plusSeconds(3600), audience, null);
    }

    private String corps(EvenementRequest request) {
        return """
            {
              "titre":"%s",
              "description":"%s",
              "lieu":"%s",
              "dateDebut":"%s",
              "dateFin":"%s",
              "audience":"%s",
              "nombrePlaces":%s
            }
            """.formatted(
                request.titre(), request.description(), request.lieu(), request.dateDebut(),
                request.dateFin(), request.audience().name(),
                request.nombrePlaces() == null ? "null" : request.nombrePlaces().toString());
    }

    private MockHttpServletRequestBuilder requeteAuthentifie(
            MockHttpServletRequestBuilder request,
            Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return request.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
