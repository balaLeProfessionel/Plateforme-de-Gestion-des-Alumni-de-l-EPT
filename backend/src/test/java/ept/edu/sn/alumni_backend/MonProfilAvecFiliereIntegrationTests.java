package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/**
 * Le compte connecté est chargé par le filtre JWT, hors de toute transaction : sa filière (une entité) doit venir
 * avec lui, sinon lire « mon profil » échouait (LazyInitializationException, servie en 403 sans message).
 */
@SpringBootTest
@AutoConfigureMockMvc
class MonProfilAvecFiliereIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private FiliereRepository filieres;

    private Utilisateur membre;

    @AfterEach
    void nettoyer() {
        if (membre != null) utilisateurs.deleteById(membre.getId());
    }

    @Test
    void unMembreAvecUneFiliereLitSonProfilAvecSonJeton() throws Exception {
        membre = new Utilisateur();
        membre.setEmail("mon-profil." + UUID.randomUUID() + "@example.invalid");
        membre.setPassword("hash-de-test");
        membre.setPrenom("Awa");
        membre.setNom("Diop");
        membre.setRole(TypeRole.ALUMNI);
        membre.setStatutCompte(StatutCompte.ACTIF);
        membre.setEmailVerifie(true);
        membre.setFiliere(FilieresDeTest.filiere(filieres, "Génie Civil"));
        membre = utilisateurs.saveAndFlush(membre);

        mockMvc.perform(get("/api/profil/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(membre))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.prenom").value("Awa"));
    }
}
