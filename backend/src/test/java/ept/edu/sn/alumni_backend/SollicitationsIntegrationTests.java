package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.repository.SollicitationRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Sollicitation des organismes (STA-11) : destinataires proposés, envoi, historique et accès. */
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
class SollicitationsIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private SollicitationRepository sollicitationRepository;
    @Autowired private ApplicationEvents evenements;

    private Utilisateur adminStages;
    private Organisme avecEmail;
    private Organisme sansEmail;
    private Organisme suspendu;

    @BeforeEach
    void preparer() {
        adminStages = compte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        avecEmail = organisme("rh@kerdata.example.invalid", StatutCompte.ACTIF);
        sansEmail = organisme(null, StatutCompte.EN_ATTENTE);
        suspendu = organisme("contact@suspendu.example.invalid", StatutCompte.SUSPENDU);
    }

    @AfterEach
    void nettoyer() {
        sollicitationRepository.deleteAll();
        organismeRepository.deleteAll(java.util.List.of(avecEmail, sansEmail, suspendu));
    }

    @Test
    void so01_lAdministrateurSolliciteLesOrganismesQuiOntUneAdresse() throws Exception {
        mockMvc.perform(authentifie(get("/api/admin/stages/sollicitations/destinataires"), adminStages))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].organismeId", hasItem(avecEmail.getId().toString())))
            .andExpect(jsonPath("$[*].organismeId", not(hasItem(sansEmail.getId().toString()))))
            .andExpect(jsonPath("$[*].organismeId", not(hasItem(suspendu.getId().toString()))));
        mockMvc.perform(authentifie(get("/api/admin/stages/sollicitations/modele").param("type", "SUJETS_PFE"), adminStages))
            .andExpect(jsonPath("$.objet").value(org.hamcrest.Matchers.startsWith("Proposition de sujets")));

        envoyer(adminStages, avecEmail.getId()).andExpect(status().isCreated())
            .andExpect(jsonPath("$.nombreDestinataires").value(1))
            .andExpect(jsonPath("$.destinataires[0].email").value("rh@kerdata.example.invalid"));
        assertThat(evenements.stream(NotificationCompte.class)).extracting(NotificationCompte::destinataire)
            .containsExactly("rh@kerdata.example.invalid");
        mockMvc.perform(authentifie(get("/api/admin/stages/sollicitations"), adminStages))
            .andExpect(jsonPath("$.contenu[0].type").value("SUJETS_PFE"))
            .andExpect(jsonPath("$.contenu[0].nombreDestinataires").value(1));
    }

    @Test
    void so02_unOrganismeSansAdresseNePeutPasEtreSolliciteEtLaPageEstReservee() throws Exception {
        envoyer(adminStages, sansEmail.getId()).andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(post("/api/admin/stages/sollicitations").contentType(MediaType.APPLICATION_JSON)
            .content("{\"type\":\"OFFRES_STAGE\",\"objet\":\"Objet\",\"message\":\"Message\",\"organismeIds\":[]}"), adminStages))
            .andExpect(status().isBadRequest());
        envoyer(compte(TypeRole.PERSONNEL), avecEmail.getId()).andExpect(status().isForbidden());
        assertThat(sollicitationRepository.count()).isZero();
    }

    private ResultActions envoyer(Utilisateur auteur, UUID organismeId) throws Exception {
        return mockMvc.perform(authentifie(post("/api/admin/stages/sollicitations").contentType(MediaType.APPLICATION_JSON)
            .content("{\"type\":\"SUJETS_PFE\",\"objet\":\"Sujets de PFE\",\"message\":\"Bonjour\",\"organismeIds\":[\"%s\"]}".formatted(organismeId)), auteur));
    }

    private Organisme organisme(String email, StatutCompte statut) {
        Organisme o = new Organisme();
        o.setNom("Sollicité " + UUID.randomUUID().toString().substring(0, 8));
        o.setEmail(email);
        o.setStatutValidation(statut);
        return organismeRepository.saveAndFlush(o);
    }

    private Utilisateur compte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur u = new Utilisateur();
        u.setEmail("sollicitation." + UUID.randomUUID() + "@example.invalid");
        u.setPassword("hash-de-test");
        u.setPrenom("Test");
        u.setNom(role.name());
        u.setRole(role);
        u.setStatutCompte(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        u.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(u);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }
}
