package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.admin.service.PremierAdminInitializer;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;
import jakarta.validation.Validator;

/**
 * Création du premier administrateur au démarrage.
 * Base à part : la base partagée garde les administrateurs créés par les autres classes,
 * et ce test a besoin d'une base qui n'en a aucun quand le contexte démarre.
 * Les tests marqués {@code @Transactional} vident les comptes puis sont annulés à la fin.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:premier_admin;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "app.premier-admin.email=Premier.Admin@Example.invalid",
    "app.premier-admin.mot-de-passe=" + PremierAdminIntegrationTests.MOT_DE_PASSE_PROVISOIRE
})
@AutoConfigureMockMvc
class PremierAdminIntegrationTests {
    static final String MOT_DE_PASSE_PROVISOIRE = "Provisoire-Test-1";
    private static final String EMAIL = "premier.admin@example.invalid";

    @Autowired private MockMvc mockMvc;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private ActionAdminRepository actionAdminRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private Validator validator;

    @Test
    void leDemarrageCreeLAdminQuiDoitChangerSonMotDePasseAvantToutAcces() throws Exception {
        Utilisateur admin = utilisateurRepository.findByEmail(EMAIL).orElseThrow();
        assertThat(admin.getRole()).isEqualTo(TypeRole.ADMIN);
        assertThat(admin.getStatutCompte()).isEqualTo(StatutCompte.ACTIF);
        assertThat(admin.getPassword()).isNotEqualTo(MOT_DE_PASSE_PROVISOIRE);
        assertThat(actionAdminRepository.findAll()).anySatisfy(action -> {
            assertThat(action.getType()).isEqualTo(TypeActionAdmin.CREATION_COMPTE);
            assertThat(action.getCible().getId()).isEqualTo(admin.getId());
            assertThat(action.getDetails()).startsWith("Premier administrateur");
        });

        String connexion = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "%s", "password": "%s"}
                    """.formatted(EMAIL, MOT_DE_PASSE_PROVISOIRE)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("ADMIN"))
            .andExpect(jsonPath("$.doitChangerMotDePasse").value(true))
            .andReturn().getResponse().getContentAsString();
        String jeton = JsonPath.read(connexion, "$.accessToken");
        String jetonRenouvellement = JsonPath.read(connexion, "$.refreshToken");

        mockMvc.perform(get("/api/admin/tableau-de-bord").header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton))
            .andExpect(status().isForbidden());

        // Le mot de passe provisoire est connu de l'exploitant : il ne peut pas devenir le mot de passe définitif.
        mockMvc.perform(post("/api/auth/changer-mot-de-passe-initial")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nouveauMotDePasse": "%s", "refreshToken": "%s"}
                    """.formatted(MOT_DE_PASSE_PROVISOIRE, jetonRenouvellement)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Choisissez un mot de passe différent du mot de passe provisoire."));

        String changement = mockMvc.perform(post("/api/auth/changer-mot-de-passe-initial")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nouveauMotDePasse": "Definitif-Test-1", "refreshToken": "%s", "prenom": " Mame Diarra ", "nom": "Ndour"}
                    """.formatted(jetonRenouvellement)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.doitChangerMotDePasse").value(false))
            .andExpect(jsonPath("$.prenom").value("Mame Diarra"))
            .andExpect(jsonPath("$.nom").value("Ndour"))
            .andReturn().getResponse().getContentAsString();
        String nouveauJeton = JsonPath.read(changement, "$.accessToken");

        mockMvc.perform(get("/api/admin/tableau-de-bord").header(HttpHeaders.AUTHORIZATION, "Bearer " + nouveauJeton))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aTraiter.administrateursActifs").value(1));

        // Le nom se corrige ensuite depuis « Mon compte », et le journal garde l'ancien.
        mockMvc.perform(patch("/api/admin/mon-compte/identite")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + nouveauJeton)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"prenom": "Mame Diarra", "nom": "Ndour Sarr"}
                    """))
            .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/admin/journal").header(HttpHeaders.AUTHORIZATION, "Bearer " + nouveauJeton))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[0].type").value("MODIFICATION_IDENTITE"))
            .andExpect(jsonPath("$.contenu[0].details").value("Mame Diarra Ndour → Mame Diarra Ndour Sarr"))
            .andExpect(jsonPath("$.contenu[0].auteur").value("Mame Diarra Ndour Sarr"));
        mockMvc.perform(patch("/api/admin/mon-compte/identite")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + nouveauJeton)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"prenom": " ", "nom": "Ndour"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.prenom").value("Le prénom est obligatoire."));
    }

    @Test
    void unAdminExistantEmpecheToutNouveauCompteEtNEstPasModifie() {
        String empreinte = utilisateurRepository.findByEmail(EMAIL).orElseThrow().getPassword();

        demarrerAvec(EMAIL, "Autre-Mot-De-Passe-1");
        demarrerAvec("autre.admin@example.invalid", "Autre-Mot-De-Passe-1");

        assertThat(utilisateurRepository.findByEmail(EMAIL).orElseThrow().getPassword()).isEqualTo(empreinte);
        assertThat(utilisateurRepository.existsByEmail("autre.admin@example.invalid")).isFalse();
    }

    @Test
    @Transactional
    void sansConfigurationLeDemarrageContinueSansAdmin() {
        viderLesComptes();

        demarrerAvec("", "");

        assertThat(utilisateurRepository.existsByRole(TypeRole.ADMIN)).isFalse();
    }

    @Test
    @Transactional
    void uneAdresseDejaInscriteArreteLeDemarrageSansPromouvoirLeCompte() {
        viderLesComptes();
        Utilisateur inscrit = new Utilisateur();
        inscrit.setEmail(EMAIL);
        inscrit.setPassword("hash-de-test");
        inscrit.setRole(TypeRole.VISITEUR);
        inscrit.setStatutCompte(StatutCompte.EN_ATTENTE);
        utilisateurRepository.saveAndFlush(inscrit);

        assertThatThrownBy(() -> demarrerAvec(EMAIL, MOT_DE_PASSE_PROVISOIRE))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("n'est pas promu");

        assertThat(utilisateurRepository.findByEmail(EMAIL).orElseThrow().getRole()).isEqualTo(TypeRole.VISITEUR);
        assertThat(utilisateurRepository.existsByRole(TypeRole.ADMIN)).isFalse();
    }

    @Test
    @Transactional
    void uneConfigurationInvalideArreteLeDemarrageSansCreerDeCompte() {
        viderLesComptes();

        assertThatThrownBy(() -> demarrerAvec("pas-une-adresse", MOT_DE_PASSE_PROVISOIRE))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Format d'email invalide");
        assertThatThrownBy(() -> demarrerAvec(EMAIL, "court"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("au moins 8 caractères")
            .hasMessageNotContaining("court");

        assertThat(utilisateurRepository.existsByRole(TypeRole.ADMIN)).isFalse();
    }

    private void demarrerAvec(String email, String motDePasse) {
        new PremierAdminInitializer(utilisateurRepository, actionAdminRepository, passwordEncoder, validator, email, motDePasse).run(null);
    }

    private void viderLesComptes() {
        actionAdminRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        utilisateurRepository.deleteAll();
        utilisateurRepository.flush();
    }
}
