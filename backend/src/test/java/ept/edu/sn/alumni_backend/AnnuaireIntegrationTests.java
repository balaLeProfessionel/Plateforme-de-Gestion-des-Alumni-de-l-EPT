package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.annuaire.AnnuaireService;
import ept.edu.sn.alumni_backend.annuaire.AnnuaireTri;
import ept.edu.sn.alumni_backend.annuaire.dto.AnnuaireMembreResponse;
import ept.edu.sn.alumni_backend.annuaire.dto.PageResponse;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AnnuaireIntegrationTests {
    private static final String GIT = "Génie Informatique et Télécommunications";

    @Autowired
    private AnnuaireService annuaireService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private OrganismeRepository organismeRepository;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void preparerUtilisateurs() {
        utilisateurRepository.deleteAll();
        utilisateurRepository.saveAll(List.of(
            utilisateur("Awa", "Diop", TypeRole.ETUDIANT, StatutCompte.ACTIF, true, "Thiès", GIT, 2025),
            utilisateur("Mamadou", "Fall", TypeRole.PERSONNEL, StatutCompte.EN_ATTENTE, true, "Dakar", "Génie Civil", 2012),
            utilisateur("Ibrahima", "Sow", TypeRole.ALUMNI, StatutCompte.ACTIF, true, "Thiès", GIT, 2024),
            utilisateur("Fatou", "Ndiaye", TypeRole.VISITEUR, StatutCompte.ACTIF, true, "Saint-Louis", null, null),
            utilisateur("Compte", "Suspendu", TypeRole.ALUMNI, StatutCompte.SUSPENDU, true, "Thiès", GIT, 2020),
            utilisateur("Compte", "Nonverifie", TypeRole.ETUDIANT, StatutCompte.ACTIF, false, "Thiès", GIT, 2026),
            utilisateur("Admin", "EPT", TypeRole.ADMIN, StatutCompte.ACTIF, true, "Thiès", null, null)
        ));
        Organisme organisme = new Organisme();
        organisme.setNom("Entreprise Démonstration");
        organisme.setSecteurActivite("Numérique");
        organisme.setAdresse("Dakar");
        organisme = organismeRepository.save(organisme);
        Utilisateur contact = utilisateur(null, "Contact", TypeRole.ORGANISME, StatutCompte.ACTIF, true, null, null, null);
        contact.setOrganisme(organisme);
        utilisateurRepository.save(contact);
    }

    @Test
    void rechercheSansTenirCompteDeLaCasse() {
        PageResponse<AnnuaireMembreResponse> resultat = rechercher("aWa", null, null, null, null, 0, 12,
            AnnuaireTri.ALPHABETIQUE);

        assertEquals(1, resultat.totalElements());
        assertEquals("Awa", resultat.contenu().getFirst().prenom());
    }

    @Test
    void combineTousLesFiltres() {
        PageResponse<AnnuaireMembreResponse> resultat = rechercher(
            "diop", TypeRole.ETUDIANT, GIT, 2025, "THI", 0, 12, AnnuaireTri.ALPHABETIQUE
        );

        assertEquals(1, resultat.totalElements());
        assertEquals("Diop", resultat.contenu().getFirst().nom());
    }

    @Test
    void rechercheUnOrganismeParSonNomPublic() {
        PageResponse<AnnuaireMembreResponse> resultat = rechercher(
            "démonstration", TypeRole.ORGANISME, null, null, null, 0, 12, AnnuaireTri.ALPHABETIQUE
        );

        assertEquals(1, resultat.totalElements());
        assertEquals("Entreprise Démonstration", resultat.contenu().getFirst().nom());
        assertNull(resultat.contenu().getFirst().prenom());
    }

    @Test
    void pagineEtTrieParPromotionDecroissanteAvecLesValeursVidesEnDernier() {
        PageResponse<AnnuaireMembreResponse> premierePage = rechercher(
            null, null, null, null, null, 0, 2, AnnuaireTri.PROMOTION_DESC
        );
        PageResponse<AnnuaireMembreResponse> secondePage = rechercher(
            null, null, null, null, null, 1, 2, AnnuaireTri.PROMOTION_DESC
        );

        assertEquals(List.of(2025, 2024), premierePage.contenu().stream()
            .map(AnnuaireMembreResponse::anneeSortie).toList());
        assertEquals(3, premierePage.totalPages());
        assertEquals(2012, secondePage.contenu().getFirst().anneeSortie());
        assertNull(secondePage.contenu().get(1).anneeSortie());
    }

    @Test
    void inclutSeulementLesComptesVisibles() {
        PageResponse<AnnuaireMembreResponse> resultat = rechercher(
            null, null, null, null, null, 0, 12, AnnuaireTri.ALPHABETIQUE
        );

        assertEquals(5, resultat.totalElements());
        assertEquals(
            List.of("ORGANISME", "ETUDIANT", "PERSONNEL", "VISITEUR", "ALUMNI"),
            resultat.contenu().stream().map(AnnuaireMembreResponse::role).toList()
        );
        assertTrue(resultat.contenu().stream().anyMatch(membre -> membre.nom().equals("Entreprise Démonstration")));
        assertTrue(resultat.contenu().stream().anyMatch(membre -> membre.statutCompte().equals("EN_ATTENTE")));
    }

    @Test
    @WithMockUser(roles = "ALUMNI")
    void borneLaTailleEtNExposeAucuneCoordonneePrivee() throws Exception {
        mockMvc.perform(get("/api/annuaire").param("taille", "49"))
            .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/annuaire").param("taille", "48"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.taille").value(48))
            .andExpect(jsonPath("$.contenu[0].email").doesNotExist())
            .andExpect(jsonPath("$.contenu[0].telephone").doesNotExist())
            .andExpect(jsonPath("$.contenu[0].dateNaissance").doesNotExist());
    }

    @Test
    void refuseLAnnuaireSansAuthentification() throws Exception {
        mockMvc.perform(get("/api/annuaire"))
            .andExpect(status().isForbidden());
    }

    @Test
    void refuseLAnnuaireAvantLeChangementDuMotDePasseInitial() throws Exception {
        Utilisateur utilisateur = utilisateurRepository.findByEmail("Awa.Diop@example.com").orElseThrow();
        utilisateur.setDoitChangerMotDePasse(true);
        utilisateurRepository.save(utilisateur);
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));

        mockMvc.perform(get("/api/annuaire").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(
                "Vous devez définir votre nouveau mot de passe avant de continuer."
            ));
    }

    private PageResponse<AnnuaireMembreResponse> rechercher(
            String recherche,
            TypeRole role,
            String filiere,
            Integer promotion,
            String ville,
            int page,
            int taille,
            AnnuaireTri tri) {
        return annuaireService.rechercher(recherche, role, filiere, promotion, ville, page, taille, tri);
    }

    private Utilisateur utilisateur(
            String prenom,
            String nom,
            TypeRole role,
            StatutCompte statut,
            boolean emailVerifie,
            String ville,
            String filiere,
            Integer anneeSortie) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail((prenom == null ? role.name() : prenom) + "." + nom + "@example.com");
        utilisateur.setPassword("mot-de-passe-hache");
        utilisateur.setPrenom(prenom);
        utilisateur.setNom(nom);
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(emailVerifie);
        utilisateur.setVilleResidence(ville);
        utilisateur.setFiliere(filiere);
        utilisateur.setAnneeSortie(anneeSortie);
        utilisateur.setTelephone("770000000");
        utilisateur.setDateNaissance(LocalDate.of(2000, 1, 1));
        return utilisateur;
    }
}
