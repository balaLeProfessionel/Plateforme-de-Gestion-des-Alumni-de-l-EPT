package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import ept.edu.sn.alumni_backend.auth.google.IdentiteGoogle;
import ept.edu.sn.alumni_backend.auth.google.JetonGoogleInvalideException;
import ept.edu.sn.alumni_backend.auth.google.VerificateurJetonGoogle;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Connexion avec Google : le jeton est simulé, les règles d'accès sont celles de la connexion par mot de passe. */
@SpringBootTest
@AutoConfigureMockMvc
class ConnexionGoogleIntegrationTests {

    @Autowired private MockMvc mvc;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private NotificationRepository notificationRepository;
    @MockitoBean private VerificateurJetonGoogle verificateur;

    @BeforeEach
    void nettoyer() {
        refreshTokenRepository.deleteAll();
        notificationRepository.deleteAll();
        for (String email : new String[] {"awa.diop@example.com", "awa.diop@ept.sn", "autre@example.com"}) {
            utilisateurRepository.findByEmail(email).ifPresent(utilisateurRepository::delete);
        }
    }

    @Test
    void exposeLIdentifiantClientPublic() throws Exception {
        mvc.perform(get("/api/auth/google/configuration"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.clientId").value("client-test.apps.googleusercontent.com"));
    }

    @Test
    void ouvreUneSessionPourUnCompteActifAvecLaMemeAdresse() throws Exception {
        compte(StatutCompte.ACTIF, true);
        google("Awa.Diop@Example.com ", true);

        connexion("jeton-google")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.email").value("awa.diop@example.com"))
            .andExpect(jsonPath("$.role").value("ALUMNI"));
    }

    @Test
    void refuseUneAdresseSansCompte() throws Exception {
        google("awa.diop@example.com", true);

        connexion("jeton-google")
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("COMPTE_INCONNU"))
            .andExpect(jsonPath("$.email").value("awa.diop@example.com"))
            .andExpect(jsonPath("$.prenom").value("Awa"))
            .andExpect(jsonPath("$.nom").value("Diop"));
    }

    // --- Inscription avec Google ---

    @Test
    void inscritAvecLAdresseDuJetonVerifieeEtEnAttenteDeValidation() throws Exception {
        google("Awa.Diop@Example.com", true);

        // L'adresse vient du jeton : un champ « email » envoyé par le navigateur serait ignoré.
        inscription("ALUMNI", ",\"email\":\"autre@example.com\",\"anneeSortie\":2018,\"filiere\":\"Génie Informatique et Télécommunications\"")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.email").value("awa.diop@example.com"))
            .andExpect(jsonPath("$.statutCompte").value("EN_ATTENTE"));

        Utilisateur awa = utilisateurRepository.findByEmail("awa.diop@example.com").orElseThrow();
        assertThat(awa.isEmailVerifie()).isTrue();
        assertThat(awa.getAnneeSortie()).isEqualTo(2018);
        assertThat(utilisateurRepository.findByEmail("autre@example.com")).isEmpty();
    }

    @Test
    void lePersonnelALAdresseOfficielleEptEstActifToutDeSuite() throws Exception {
        google("awa.diop@ept.sn", true);

        inscription("PERSONNEL", "").andExpect(status().isCreated())
            .andExpect(jsonPath("$.statutCompte").value("ACTIF"));
    }

    @Test
    void lInscriptionGoogleGardeLesReglesDeLInscription() throws Exception {
        google("awa.diop@example.com", true);
        inscription("ETUDIANT", "").andExpect(status().isForbidden());

        compte(StatutCompte.ACTIF, true);
        inscription("ALUMNI", "").andExpect(status().isConflict());

        google("awa.diop@ept.sn", false);
        inscription("ALUMNI", "").andExpect(status().isUnauthorized());
        assertThat(utilisateurRepository.findByEmail("awa.diop@ept.sn")).isEmpty();
    }

    @Test
    void unCompteJamaisVerifieEstVerifieParGoogleEtSonMotDePasseRemplace() throws Exception {
        // Quelqu'un a pu s'inscrire avec l'adresse d'Awa sans jamais valider le code : il ne doit plus pouvoir entrer.
        compte(StatutCompte.EN_ATTENTE, false);
        google("awa.diop@example.com", true);

        connexion("jeton-google").andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isNotEmpty());

        Utilisateur awa = utilisateurRepository.findByEmail("awa.diop@example.com").orElseThrow();
        assertThat(awa.isEmailVerifie()).isTrue();
        assertThat(awa.getPassword()).isNotEqualTo("mot-de-passe-hache");
        assertThat(awa.getStatutCompte()).isEqualTo(StatutCompte.EN_ATTENTE);
    }

    @Test
    void refuseUneAdresseGoogleNonVerifiee() throws Exception {
        compte(StatutCompte.ACTIF, true);
        google("awa.diop@example.com", false);

        connexion("jeton-google").andExpect(status().isUnauthorized());
    }

    @Test
    void refuseUnJetonInvalideOuAbsent() throws Exception {
        when(verificateur.verifier(anyString())).thenThrow(new JetonGoogleInvalideException("La connexion Google a échoué. Réessayez."));

        connexion("faux").andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("La connexion Google a échoué. Réessayez."));
        mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON).content("{\"credential\":\" \"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void refuseUnCompteSuspendu() throws Exception {
        compte(StatutCompte.SUSPENDU, true);
        google("awa.diop@example.com", true);
        connexion("jeton-google").andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Votre compte a été suspendu. Contactez l'administration."));
    }

    private ResultActions inscription(String role, String complement) throws Exception {
        return mvc.perform(post("/api/auth/google/inscription").contentType(MediaType.APPLICATION_JSON)
            .content("{\"credential\":\"jeton-google\",\"prenom\":\"Awa\",\"nom\":\"Diop\",\"role\":\"" + role + "\""
                + complement + "}"));
    }

    private ResultActions connexion(String jeton) throws Exception {
        return mvc.perform(post("/api/auth/google").contentType(MediaType.APPLICATION_JSON)
            .content("{\"credential\":\"" + jeton + "\"}"));
    }

    private void google(String email, boolean verifie) {
        when(verificateur.verifier(anyString())).thenReturn(new IdentiteGoogle(email, verifie, "Awa", "Diop"));
    }

    private Utilisateur compte(StatutCompte statut, boolean emailVerifie) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("awa.diop@example.com");
        utilisateur.setPassword("mot-de-passe-hache");
        utilisateur.setPrenom("Awa");
        utilisateur.setNom("Diop");
        utilisateur.setRole(TypeRole.ALUMNI);
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(emailVerifie);
        utilisateur.setTelephone("770000000");
        utilisateur.setDateNaissance(LocalDate.of(2000, 1, 1));
        return utilisateurRepository.saveAndFlush(utilisateur);
    }
}
