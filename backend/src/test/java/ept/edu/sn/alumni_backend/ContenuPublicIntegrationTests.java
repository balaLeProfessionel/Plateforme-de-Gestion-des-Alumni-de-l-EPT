package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.function.Consumer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.temoignage.entity.Temoignage;
import ept.edu.sn.alumni_backend.temoignage.repository.TemoignageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ContenuPublicIntegrationTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EvenementRepository evenementRepository;

    @Autowired
    private ParticipationEvenementRepository participationEvenementRepository;

    @Autowired
    private TemoignageRepository temoignageRepository;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private Utilisateur organisateur;

    @BeforeEach
    void preparer() {
        participationEvenementRepository.deleteAll();
        evenementRepository.deleteAll();
        temoignageRepository.deleteAll();

        organisateur = new Utilisateur();
        organisateur.setNom("Organisateur");
        organisateur.setEmail(UUID.randomUUID() + "@exemple.test");
        organisateur.setPassword("mot-de-passe");
        organisateur.setRole(TypeRole.ADMIN);
        organisateur.setStatutCompte(StatutCompte.ACTIF);
        organisateur.setEmailVerifie(true);
        organisateur = utilisateurRepository.save(organisateur);
    }

    @Test
    void montreSansCompteLesTroisProchainsEvenementsOfficielsOuvertsATous() throws Exception {
        evenement("Quatrième", 4, e -> { });
        evenement("Deuxième", 2, e -> { });
        evenement("Premier", 1, e -> e.setLieu("Campus de l’EPT"));
        evenement("Troisième", 3, e -> { });

        mockMvc.perform(get("/api/public/evenements"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(3)))
            .andExpect(jsonPath("$[0].titre").value("Premier"))
            .andExpect(jsonPath("$[0].lieu").value("Campus de l’EPT"))
            .andExpect(jsonPath("$[1].titre").value("Deuxième"))
            .andExpect(jsonPath("$[2].titre").value("Troisième"))
            .andExpect(jsonPath("$[0].id").doesNotExist())
            .andExpect(jsonPath("$[0].description").doesNotExist())
            .andExpect(jsonPath("$[0].organisateur").doesNotExist());
    }

    @Test
    void neMontrePasLesAutresEvenements() throws Exception {
        evenement("D’un membre", 1, e -> e.setOfficielEpt(false));
        evenement("Pour les alumni", 1, e -> e.setAudience(AudienceEvenement.ALUMNI));
        evenement("Annulé", 1, e -> e.setStatut(StatutEvenement.ANNULE));
        evenement("Passé", -1, e -> { });

        mockMvc.perform(get("/api/public/evenements"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void laListeCompleteDesEvenementsResteReservee() throws Exception {
        mockMvc.perform(get("/api/evenements")).andExpect(status().is4xxClientError());
    }

    @Test
    void montreSansCompteLesTemoignagesPubliesDansLOrdre() throws Exception {
        temoignage("Deuxième", 2, true);
        temoignage("Premier", 1, true);
        temoignage("Non publié", 0, false);

        mockMvc.perform(get("/api/public/temoignages"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].nom").value("Premier"))
            .andExpect(jsonPath("$[0].promotion").value("D2012"))
            .andExpect(jsonPath("$[0].fonction").value("Fonction"))
            .andExpect(jsonPath("$[0].organisation").value("Organisation"))
            .andExpect(jsonPath("$[0].pays").value("Sénégal"))
            .andExpect(jsonPath("$[0].texte").value("Texte"))
            .andExpect(jsonPath("$[1].nom").value("Deuxième"))
            .andExpect(jsonPath("$[0].id").doesNotExist());
    }

    @Test
    void limiteLeNombreDeTemoignagesDuCarrousel() throws Exception {
        for (int i = 0; i < 12; i++) {
            temoignage("Personne " + i, i, true);
        }

        mockMvc.perform(get("/api/public/temoignages"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(10)));
    }

    private void evenement(String titre, int jours, Consumer<Evenement> ajustement) {
        Evenement evenement = new Evenement();
        evenement.setTitre(titre);
        evenement.setDescription("Description");
        evenement.setLieu("Thiès");
        evenement.setDateDebut(Instant.now().plus(Duration.ofDays(jours)));
        evenement.setDateFin(Instant.now().plus(Duration.ofDays(jours)).plus(Duration.ofHours(2)));
        evenement.setAudience(AudienceEvenement.TOUS);
        evenement.setOfficielEpt(true);
        evenement.setOrganisateur(organisateur);
        ajustement.accept(evenement);
        evenementRepository.save(evenement);
    }

    private void temoignage(String nom, int ordre, boolean publie) {
        Temoignage temoignage = new Temoignage();
        temoignage.setNom(nom);
        temoignage.setPromotion("D2012");
        temoignage.setFonction("Fonction");
        temoignage.setOrganisation("Organisation");
        temoignage.setPays("Sénégal");
        temoignage.setTexte("Texte");
        temoignage.setOrdre(ordre);
        temoignage.setPublie(publie);
        temoignageRepository.save(temoignage);
    }
}
