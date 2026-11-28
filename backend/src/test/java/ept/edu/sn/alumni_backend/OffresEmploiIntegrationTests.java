package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.emploi.repository.OffreEmploiRepository;
import ept.edu.sn.alumni_backend.emploi.repository.SignalementOffreEmploiRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Offres d'emploi relayées : publication, consultation, filtres, gestion par l'auteur et signalement (#221). */
@SpringBootTest
@AutoConfigureMockMvc
class OffresEmploiIntegrationTests {
    private static final LocalDate AUJOURDHUI = LocalDate.now(ZoneId.of("Africa/Dakar"));

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OffreEmploiRepository offreRepository;
    @Autowired private SignalementOffreEmploiRepository signalementRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;

    private final String lot = UUID.randomUUID().toString().substring(0, 8);
    private final List<UUID> filieresCreees = new ArrayList<>();
    private Utilisateur alumni;
    private Utilisateur etudiant;
    private Utilisateur personnel;

    @BeforeEach
    void preparer() {
        alumni = creerCompte(TypeRole.ALUMNI);
        etudiant = creerCompte(TypeRole.ETUDIANT);
        personnel = creerCompte(TypeRole.PERSONNEL);
    }

    @AfterEach
    void nettoyer() {
        signalementRepository.deleteAll();
        offreRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        filiereRepository.deleteAllById(filieresCreees);
    }

    @Test
    void e01_unAlumniRelaieUneOffrePublieeAussitot() throws Exception {
        String corps = offre("Ingénieur data " + lot, "CDI", "Dakar", AUJOURDHUI.plusMonths(1), "linkedin.com/jobs/view/123",
            "[\"Java\", \"java\", \" Spring   Boot \"]", "[]");
        envoyer(post("/api/offres-emploi/relayees"), alumni, corps)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.mode").value("RELAYEE"))
            .andExpect(jsonPath("$.statut").value("PUBLIEE"))
            .andExpect(jsonPath("$.entreprise").value("Entreprise " + lot))
            .andExpect(jsonPath("$.lienSource").value("https://linkedin.com/jobs/view/123"))
            .andExpect(jsonPath("$.competences", containsInAnyOrder("Java", "Spring Boot")))
            .andExpect(jsonPath("$.auteur.role").value("ALUMNI"))
            .andExpect(jsonPath("$.modifiable").value(true));
    }

    @Test
    void e02_seulsAlumniEtudiantsEtPersonnelActifsRelaient() throws Exception {
        String corps = offre("Poste " + lot, "STAGE", "Thiès", AUJOURDHUI.plusDays(10), "https://exemple.sn/offre", "[]", "[]");
        envoyer(post("/api/offres-emploi/relayees"), etudiant, corps).andExpect(status().isCreated());
        envoyer(post("/api/offres-emploi/relayees"), personnel, corps).andExpect(status().isCreated());
        envoyer(post("/api/offres-emploi/relayees"), creerCompte(TypeRole.ORGANISME), corps).andExpect(status().isForbidden());
        envoyer(post("/api/offres-emploi/relayees"), creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_OFFRES_EMPLOI), corps)
            .andExpect(status().isForbidden());
        envoyer(post("/api/offres-emploi/relayees"), creerCompte(TypeRole.VISITEUR), corps).andExpect(status().isForbidden());
        Utilisateur enAttente = creerCompte(TypeRole.ALUMNI);
        enAttente.setStatutCompte(StatutCompte.EN_ATTENTE);
        utilisateurRepository.saveAndFlush(enAttente);
        envoyer(post("/api/offres-emploi/relayees"), enAttente, corps).andExpect(status().isForbidden());
    }

    @Test
    void e03_lesChampsEtLesDatesSontControles() throws Exception {
        envoyer(post("/api/offres-emploi/relayees"), alumni,
            offre("Sans lien " + lot, "CDD", "Dakar", AUJOURDHUI.plusDays(5), "", "[]", "[]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.lienSource").exists());
        envoyer(post("/api/offres-emploi/relayees"), alumni,
            offre("Lien ftp " + lot, "CDD", "Dakar", AUJOURDHUI.plusDays(5), "ftp://exemple.sn/x", "[]", "[]"))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/offres-emploi/relayees"), alumni,
            offre("Passée " + lot, "CDD", "Dakar", AUJOURDHUI.minusDays(1), "https://exemple.sn", "[]", "[]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("La date d'expiration ne peut pas être passée."));
        envoyer(post("/api/offres-emploi/relayees"), alumni,
            offre("Trop loin " + lot, "CDD", "Dakar", AUJOURDHUI.plusMonths(6).plusDays(1), "https://exemple.sn", "[]", "[]"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Une offre reste en ligne 6 mois au plus."));
    }

    @Test
    void e04_lesFiltresSeCombinentEtLesOffresExpireesSontMasquees() throws Exception {
        Filiere info = filiere("Informatique " + lot);
        Filiere civil = filiere("Civil " + lot);
        relayer(alumni, offre("Développeur Angular " + lot, "CDI", "Dakar", AUJOURDHUI.plusDays(20), "https://a.sn", "[]",
            "[\"" + info.getId() + "\"]"));
        relayer(alumni, offre("Analyste généraliste " + lot, "CDD", "Thiès", AUJOURDHUI.plusDays(20), "https://b.sn", "[]", "[]"));
        relayer(alumni, offre("Conducteur de travaux " + lot, "CDI", "Dakar", AUJOURDHUI.plusDays(20), "https://c.sn", "[]",
            "[\"" + civil.getId() + "\"]"));
        String expiree = relayer(alumni, offre("Ancienne offre " + lot, "CDI", "Dakar", AUJOURDHUI.plusDays(1), "https://d.sn", "[]", "[]"));
        offreRepository.findById(UUID.fromString(expiree)).ifPresent(o -> {
            o.setDateExpiration(AUJOURDHUI.minusDays(1));
            offreRepository.saveAndFlush(o);
        });

        lister(etudiant, "q=" + lot).andExpect(jsonPath("$.totalElements").value(3));
        lister(etudiant, "q=" + lot + "&expirees=true").andExpect(jsonPath("$.totalElements").value(4));
        lister(etudiant, "q=" + lot + "&type=CDI&lieu=dakar").andExpect(jsonPath("$.totalElements").value(2));
        // Une filière retient les offres qui la visent et celles ouvertes à toutes les filières.
        lister(etudiant, "q=" + lot + "&filiere=" + info.getId())
            .andExpect(jsonPath("$.contenu[*].titre",
                containsInAnyOrder("Développeur Angular " + lot, "Analyste généraliste " + lot)));
        lister(etudiant, "q=" + lot + "&type=CDI&filiere=" + civil.getId())
            .andExpect(jsonPath("$.contenu", hasSize(1)))
            .andExpect(jsonPath("$.contenu[0].titre").value("Conducteur de travaux " + lot));
        lister(etudiant, "q=angular " + lot).andExpect(jsonPath("$.totalElements").value(1));
        lister(etudiant, "q=angular " + lot + "&lieu=Thiès").andExpect(jsonPath("$.totalElements").value(0));
        envoyer(get("/api/offres-emploi/{id}", expiree), etudiant, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.expiree").value(true));
    }

    @Test
    void e05_seulLAuteurModifieEtRetireSonOffre() throws Exception {
        String id = relayer(alumni, offre("Offre à gérer " + lot, "CDI", "Dakar", AUJOURDHUI.plusDays(10), "https://e.sn", "[]", "[]"));
        String prolongee = offre("Offre à gérer " + lot, "CDI", "Saint-Louis", AUJOURDHUI.plusMonths(2), "https://e.sn", "[]", "[]");
        envoyer(put("/api/offres-emploi/{id}", id), etudiant, prolongee).andExpect(status().isNotFound());
        envoyer(put("/api/offres-emploi/{id}", id), alumni, prolongee)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lieu").value("Saint-Louis"))
            .andExpect(jsonPath("$.dateExpiration").value(AUJOURDHUI.plusMonths(2).toString()));

        envoyer(patch("/api/offres-emploi/{id}/retirer", id), etudiant, null).andExpect(status().isNotFound());
        envoyer(patch("/api/offres-emploi/{id}/retirer", id), alumni, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("RETIREE"))
            .andExpect(jsonPath("$.modifiable").value(false));
        envoyer(patch("/api/offres-emploi/{id}/retirer", id), alumni, null).andExpect(status().isConflict());
        envoyer(put("/api/offres-emploi/{id}", id), alumni, prolongee).andExpect(status().isConflict());

        // Retirée : elle sort de la liste et n'existe plus pour les autres membres.
        lister(etudiant, "q=" + lot).andExpect(jsonPath("$.totalElements").value(0));
        envoyer(get("/api/offres-emploi/{id}", id), etudiant, null).andExpect(status().isNotFound());
        envoyer(get("/api/offres-emploi/{id}", id), alumni, null).andExpect(status().isOk());
        envoyer(get("/api/offres-emploi/{id}", id), creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_OFFRES_EMPLOI), null)
            .andExpect(status().isOk());
        envoyer(get("/api/offres-emploi/{id}", id), creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES), null)
            .andExpect(status().isNotFound());
        envoyer(get("/api/offres-emploi/mes-offres"), alumni, null)
            .andExpect(jsonPath("$[?(@.id == '" + id + "')].statut").value("RETIREE"));
    }

    @Test
    void e06_unMembreSignaleUneFoisUneOffreDUnAutre() throws Exception {
        String id = relayer(alumni, offre("Offre douteuse " + lot, "FREELANCE", "Dakar", AUJOURDHUI.plusDays(10), "https://f.sn", "[]", "[]"));
        String signalement = "{\"motif\": \"ARNAQUE\", \"commentaire\": \"Demande de paiement\"}";
        envoyer(get("/api/offres-emploi/{id}", id), etudiant, null).andExpect(jsonPath("$.signalable").value(true));
        envoyer(post("/api/offres-emploi/{id}/signalements", id), etudiant, signalement).andExpect(status().isNoContent());
        envoyer(post("/api/offres-emploi/{id}/signalements", id), etudiant, signalement)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez déjà signalé cette offre."));
        envoyer(get("/api/offres-emploi/{id}", id), etudiant, null).andExpect(jsonPath("$.signalable").value(false));
        envoyer(post("/api/offres-emploi/{id}/signalements", id), alumni, signalement).andExpect(status().isConflict());
        envoyer(post("/api/offres-emploi/{id}/signalements", id), personnel, "{\"motif\": \"INCONNU\"}").andExpect(status().isBadRequest());
    }

    @Test
    void e07_unVisiteurNAccedePasAuxOffres() throws Exception {
        String id = relayer(alumni, offre("Offre membres " + lot, "CDI", "Dakar", AUJOURDHUI.plusDays(10), "https://g.sn", "[]", "[]"));
        Utilisateur visiteur = creerCompte(TypeRole.VISITEUR);
        envoyer(get("/api/offres-emploi"), visiteur, null).andExpect(status().isForbidden());
        envoyer(get("/api/offres-emploi/{id}", id), visiteur, null).andExpect(status().isForbidden());
        // Sans jeton, le projet répond 403 (pas de point d'entrée 401 configuré).
        mockMvc.perform(get("/api/offres-emploi")).andExpect(status().isForbidden());
        envoyer(get("/api/offres-emploi/{id}", id), creerCompte(TypeRole.ORGANISME), null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.motifDecision", nullValue()));
    }

    private ResultActions lister(Utilisateur lecteur, String criteres) throws Exception {
        MockHttpServletRequestBuilder requete = get("/api/offres-emploi");
        for (String critere : criteres.split("&")) {
            String[] cleValeur = critere.split("=", 2);
            requete.param(cleValeur[0], cleValeur[1]);
        }
        return envoyer(requete, lecteur, null).andExpect(status().isOk());
    }

    private String relayer(Utilisateur auteur, String corps) throws Exception {
        String reponse = envoyer(post("/api/offres-emploi/relayees"), auteur, corps)
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return JsonPath.read(reponse, "$.id");
    }

    private String offre(String titre, String type, String lieu, LocalDate expiration, String lien, String competences, String filieres) {
        return """
            {"titre": "%s", "description": "Description de l'offre", "entreprise": "Entreprise %s", "typeContrat": "%s",
             "lieu": "%s", "dateExpiration": "%s", "lienSource": "%s", "source": "LinkedIn",
             "competences": %s, "filieres": %s}
            """.formatted(titre, lot, type, lieu, expiration, lien, competences, filieres);
    }

    private Filiere filiere(String nom) {
        Filiere filiere = FilieresDeTest.filiere(filiereRepository, nom);
        filieresCreees.add(filiere.getId());
        return filiere;
    }

    private Utilisateur creerCompte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("emploi." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom("Test");
        compte.setNom(role.name() + "-" + lot);
        compte.setRole(role);
        compte.setStatutCompte(StatutCompte.ACTIF);
        compte.setEmailVerifie(true);
        compte.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(compte);
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        String jeton = jwtService.genererToken(new UtilisateurPrincipal(auteur));
        requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton);
        if (corps != null) {
            requete.contentType(MediaType.APPLICATION_JSON).content(corps);
        }
        return mockMvc.perform(requete);
    }
}
