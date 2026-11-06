package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnnuairePublicIntegrationTests {
    private static final String URL = "/api/public/annuaire";

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private EvenementRepository evenementRepository;

    @Autowired
    private ParticipationEvenementRepository participationEvenementRepository;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void preparer() {
        participationEvenementRepository.deleteAll();
        evenementRepository.deleteAll();
        utilisateurRepository.deleteAll();
    }

    @Test
    void trouveUnDiplomeSansCompteEtNeRenvoieQueLesChampsPublics() throws Exception {
        creer("Ibrahima", "Sowane", u -> { });

        mockMvc.perform(get(URL).param("recherche", "sowa"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].prenom").value("Ibrahima"))
            .andExpect(jsonPath("$[0].nom").value("Sowane"))
            .andExpect(jsonPath("$[0].promotion").value(2020))
            .andExpect(jsonPath("$[0].filiere").value("Génie Civil"))
            .andExpect(jsonPath("$[0].id").doesNotExist())
            .andExpect(jsonPath("$[0].email").doesNotExist())
            .andExpect(jsonPath("$[0].urlPhoto").doesNotExist())
            .andExpect(jsonPath("$[0].villeResidence").doesNotExist())
            .andExpect(jsonPath("$[0].posteActuel").doesNotExist())
            .andExpect(jsonPath("$[0].telephone").doesNotExist());
    }

    @Test
    void exclutCeuxQuiNeDoiventPasEtreTrouves() throws Exception {
        creer("Retire", "Sowane", u -> u.setRecherchePublique(false));
        creer("Attente", "Sowane", u -> u.setStatutCompte(StatutCompte.EN_ATTENTE));
        creer("Suspendu", "Sowane", u -> u.setStatutCompte(StatutCompte.SUSPENDU));
        creer("Nonverifie", "Sowane", u -> u.setEmailVerifie(false));
        creer("Jamaisouvert", "Sowane", u -> u.setDoitChangerMotDePasse(true));
        creer("Etudiant", "Sowane", u -> u.setRole(TypeRole.ETUDIANT));
        creer("Personnel", "Sowane", u -> u.setRole(TypeRole.PERSONNEL));
        creer("Visiteur", "Sowane", u -> u.setRole(TypeRole.VISITEUR));

        mockMvc.perform(get(URL).param("recherche", "sowane"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void refuseUneRechercheTropCourteOuAbsente() throws Exception {
        creer("Ibrahima", "Sowane", u -> { });

        mockMvc.perform(get(URL).param("recherche", "so")).andExpect(status().isBadRequest());
        mockMvc.perform(get(URL).param("recherche", "   ")).andExpect(status().isBadRequest());
        mockMvc.perform(get(URL)).andExpect(status().isBadRequest());
    }

    @Test
    void lesJokersNePermettentPasDeListerLAnnuaire() throws Exception {
        creer("Ibrahima", "Sowane", u -> { });

        mockMvc.perform(get(URL).param("recherche", "%%%")).andExpect(status().isBadRequest());
        mockMvc.perform(get(URL).param("recherche", "___")).andExpect(status().isBadRequest());
        mockMvc.perform(get(URL).param("recherche", "sow%e"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get(URL).param("recherche", "s_w%e"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void limiteLeNombreDeResultats() throws Exception {
        for (int i = 0; i < 12; i++) {
            creer("Membre", "Sowane", u -> { });
        }

        mockMvc.perform(get(URL).param("recherche", "sowane"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(10)));
    }

    @Test
    void lAnnuaireCompletResteReserveAuxMembres() throws Exception {
        mockMvc.perform(get("/api/annuaire").param("recherche", "sowane"))
            .andExpect(status().is4xxClientError());
    }

    private void creer(String prenom, String nom, Consumer<Utilisateur> ajustement) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setPrenom(prenom);
        utilisateur.setNom(nom);
        utilisateur.setEmail(UUID.randomUUID() + "@exemple.test");
        utilisateur.setPassword("mot-de-passe");
        utilisateur.setRole(TypeRole.ALUMNI);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        utilisateur.setAnneeSortie(2020);
        utilisateur.setFiliere("Génie Civil");
        utilisateur.setVilleResidence("Thiès");
        utilisateur.setPosteActuel("Ingénieur");
        ajustement.accept(utilisateur);
        utilisateurRepository.save(utilisateur);
    }
}
