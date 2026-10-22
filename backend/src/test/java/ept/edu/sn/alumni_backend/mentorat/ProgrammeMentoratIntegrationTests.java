package ept.edu.sn.alumni_backend.mentorat;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.mentorat.entity.Mentorat;
import ept.edu.sn.alumni_backend.mentorat.entity.ProgressionJalon;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/** Cas G-* (gestion, lot 1) et V-* (programme visible et mentors volontaires, lot 2) du catalogue. */
@SpringBootTest
@AutoConfigureMockMvc
class ProgrammeMentoratIntegrationTests extends MentoratTestsBase {
    private static final String MESSAGE_ROLE = "Les programmes sont gérés par le personnel de l'EPT et l'administration.";

    private Utilisateur personnel;
    private Utilisateur autrePersonnel;
    private Utilisateur admin;
    private Utilisateur etudiant;

    @BeforeEach
    void preparer() {
        personnel = creerUtilisateur(TypeRole.PERSONNEL, "Faye");
        autrePersonnel = creerUtilisateur(TypeRole.PERSONNEL, "Ka");
        admin = creerUtilisateur(TypeRole.ADMIN, "Admin");
        etudiant = creerUtilisateur(TypeRole.ETUDIANT, "Ndiaye");
    }

    @Test
    void g01_lePersonnelCreeUnBrouillonAvecSesEtapesDansLOrdre() throws Exception {
        envoyer(post("/api/mentorat/programmes"), personnel, programme("  Orientation lycée 2026  ",
                etape(null, "Premier échange"), etape(null, "Visite de l'EPT"), etape(null, "Choix de filière")))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", containsString("/api/mentorat/programmes/")))
            .andExpect(jsonPath("$.titre").value("Orientation lycée 2026"))
            .andExpect(jsonPath("$.statut").value("BROUILLON"))
            .andExpect(jsonPath("$.responsable.id").value(personnel.getId().toString()))
            .andExpect(jsonPath("$.responsable.email").doesNotExist())
            .andExpect(jsonPath("$.etapes[*].titre").value(contains("Premier échange", "Visite de l'EPT", "Choix de filière")))
            .andExpect(jsonPath("$.etapes[*].ordre").value(contains(1, 2, 3)))
            .andExpect(jsonPath("$.nombreMentorats").value(0))
            .andExpect(jsonPath("$.gerable").value(true));
    }

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"ETUDIANT", "ALUMNI", "VISITEUR", "ORGANISME"})
    void g02_seulsLePersonnelEtLAdministrationGerentLesProgrammes(TypeRole role) throws Exception {
        Utilisateur membre = creerUtilisateur(role, "Membre");
        envoyer(post("/api/mentorat/programmes"), membre, programme("Programme", etape(null, "Étape")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(MESSAGE_ROLE));
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/geres"), membre))
            .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"titre\":\"  \",\"dateDebut\":\"2026-11-01\",\"dateFin\":\"2027-03-31\",\"etapes\":[]}",
        "{\"titre\":\"Programme\",\"dateDebut\":\"2026-11-01\",\"dateFin\":\"2026-10-31\",\"etapes\":[]}",
        "{\"titre\":\"Programme\",\"dateFin\":\"2027-03-31\",\"etapes\":[]}",
        "{\"titre\":\"Programme\",\"dateDebut\":\"2026-11-01\",\"dateFin\":\"2027-03-31\"}",
        "{\"titre\":\"Programme\",\"dateDebut\":\"2026-11-01\",\"dateFin\":\"2027-03-31\",\"etapes\":[{\"titre\":\" \"}]}",
    })
    void g03_unProgrammeInvalideEstRefuse(String corps) throws Exception {
        envoyer(post("/api/mentorat/programmes"), personnel, corps).andExpect(status().isBadRequest());
    }

    @Test
    void g04_auPlusDixEtapesEtPasDEtapeExistanteDansUnNouveauProgramme() throws Exception {
        String[] onze = new String[11];
        for (int i = 0; i < onze.length; i++) onze[i] = etape(null, "Étape " + i);
        envoyer(post("/api/mentorat/programmes"), personnel, programme("Programme", onze))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/mentorat/programmes"), personnel, programme("Programme", etape(UUID.randomUUID(), "Étape")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void g05_unBrouillonNExistePasPourLesAutresMaisLAdministrationLeGere() throws Exception {
        UUID id = creer(personnel, "Brouillon", "Étape");

        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), autrePersonnel)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant)).andExpect(status().isNotFound());
        envoyer(put("/api/mentorat/programmes/{id}", id), autrePersonnel, programme("Pris", etape(null, "Étape")))
            .andExpect(status().isNotFound());

        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.gerable").value(true));
        creer(autrePersonnel, "Autre", "Étape");
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/geres"), personnel))
            .andExpect(jsonPath("$[*].titre").value(contains("Brouillon")));
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/geres"), admin))
            .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void g06_modifierReordonneRenommeAjouteEtRetireLesEtapesEnGardantLeursIdentifiants() throws Exception {
        String reponse = envoyer(post("/api/mentorat/programmes"), personnel,
                programme("Programme", etape(null, "A"), etape(null, "B"), etape(null, "C")))
            .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(JsonPath.read(reponse, "$.id"));
        List<String> ids = JsonPath.read(reponse, "$.etapes[*].id");

        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Programme revu",
                etape(UUID.fromString(ids.get(2)), "C renommée"), etape(null, "D"), etape(UUID.fromString(ids.get(0)), "A")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.titre").value("Programme revu"))
            .andExpect(jsonPath("$.etapes[*].titre").value(contains("C renommée", "D", "A")))
            .andExpect(jsonPath("$.etapes[0].id").value(ids.get(2)))
            .andExpect(jsonPath("$.etapes[2].id").value(ids.get(0)))
            .andExpect(jsonPath("$.etapes[*].ordre").value(contains(1, 2, 3)));

        UUID etrangere = UUID.fromString(JsonPath.read(envoyer(post("/api/mentorat/programmes"), personnel,
            programme("Autre", etape(null, "X"))).andReturn().getResponse().getContentAsString(), "$.etapes[0].id"));
        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Programme", etape(etrangere, "X")))
            .andExpect(status().isBadRequest());
        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Programme",
                etape(UUID.fromString(ids.get(0)), "A"), etape(UUID.fromString(ids.get(0)), "A bis")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void g07_cycleDeVieOuvertureEnCoursClotureEtProgrammeFige() throws Exception {
        UUID vide = creer(personnel, "Sans étape");
        changerStatutProgramme(vide, "OUVERT", personnel)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ajoutez au moins une étape avant d'ouvrir le programme."));

        UUID id = creer(personnel, "Orientation", "Premier échange");
        changerStatutProgramme(id, "OUVERT", personnel).andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("OUVERT"));
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.gerable").value(false));
        envoyer(put("/api/mentorat/programmes/{id}", id), etudiant, programme("Pris", etape(null, "X")))
            .andExpect(status().isForbidden());
        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Orientation"))
            .andExpect(status().isConflict());

        changerStatutProgramme(id, "EN_COURS", personnel).andExpect(status().isOk());
        changerStatutProgramme(id, "CLOS", admin).andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("CLOS"));
        changerStatutProgramme(id, "OUVERT", personnel)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce programme ne peut pas passer de « Clos » à « Ouvert »."));
        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Orientation", etape(null, "X")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Un programme clos ne se modifie plus."));
    }

    @Test
    void g08_unProgrammeSuiviParUnMentoratNeRedevientPasBrouillonEtNeSeSupprimePas() throws Exception {
        UUID id = creer(personnel, "Orientation", "Premier échange");
        changerStatutProgramme(id, "OUVERT", personnel);
        rattacherUnMentorat(id);

        changerStatutProgramme(id, "BROUILLON", personnel)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Des mentorats suivent déjà ce programme : il ne peut plus redevenir un brouillon."));
        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}", id), personnel)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), personnel))
            .andExpect(jsonPath("$.nombreMentorats").value(1));
    }

    @Test
    void g09_seulUnBrouillonSansMentoratSeSupprime() throws Exception {
        UUID id = creer(personnel, "À jeter", "Étape");
        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}", id), autrePersonnel)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}", id), personnel)).andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), personnel)).andExpect(status().isNotFound());
    }

    @Test
    void g10_uneEtapeDejaFranchieNePeutPlusEtreRetiree() throws Exception {
        String reponse = envoyer(post("/api/mentorat/programmes"), personnel,
                programme("Orientation", etape(null, "Premier échange"), etape(null, "Visite")))
            .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(JsonPath.read(reponse, "$.id"));
        List<String> ids = JsonPath.read(reponse, "$.etapes[*].id");
        changerStatutProgramme(id, "OUVERT", personnel);
        Mentorat mentorat = rattacherUnMentorat(id);
        ProgressionJalon progression = new ProgressionJalon();
        progression.setMentorat(mentorat);
        progression.setJalon(jalonRepository.findById(UUID.fromString(ids.get(0))).orElseThrow());
        progression.setAtteintLe(Instant.now());
        progression.setValidePar(etudiant);
        progressionRepository.saveAndFlush(progression);

        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Orientation", etape(UUID.fromString(ids.get(1)), "Visite")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Une étape déjà franchie par un mentorat ne peut pas être retirée."));
        // Renommer ou retirer une étape encore jamais franchie reste possible.
        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Orientation", etape(UUID.fromString(ids.get(0)), "Premier contact")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.etapes[*].titre").value(contains("Premier contact")));
    }

    // ---------- Lot 2 : programme visible et mentors volontaires ----------

    @Test
    void v01_seulsLesProgrammesOuvertsSontProposesATousLesMembres() throws Exception {
        UUID ouvert = creer(personnel, "Orientation", "Étape");
        changerStatutProgramme(ouvert, "OUVERT", personnel);
        creer(personnel, "Brouillon", "Étape");
        UUID enCours = creer(autrePersonnel, "Insertion", "Étape");
        changerStatutProgramme(enCours, "OUVERT", autrePersonnel);
        changerStatutProgramme(enCours, "EN_COURS", autrePersonnel);

        mockMvc.perform(authentifie(get("/api/mentorat/programmes/ouverts"), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].titre").value(contains("Orientation")))
            .andExpect(jsonPath("$[0].gerable").value(false))
            .andExpect(jsonPath("$[0].nombreMentors").value(0));
    }

    @Test
    void v02_unMembreAvecUneOffreDevientMentorVolontairePuisSeRetire() throws Exception {
        UUID id = creer(personnel, "Orientation", "Étape");
        changerStatutProgramme(id, "OUVERT", personnel);
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Volontaire");
        creerProfil(mentor, true, 2, data);
        Utilisateur autreMentor = creerUtilisateur(TypeRole.ALUMNI, "Absent");
        creerProfil(autreMentor, true, 2, data);

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), mentor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jeParticipe").value(true))
                .andExpect(jsonPath("$.nombreMentors").value(1));
        }
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("programme", id.toString()), etudiant))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].utilisateurId").value(mentor.getId().toString()));
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant))
            .andExpect(jsonPath("$.jeParticipe").value(false))
            .andExpect(jsonPath("$.nombreMentors").value(1));

        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}/participation", id), mentor))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jeParticipe").value(false))
            .andExpect(jsonPath("$.nombreMentors").value(0));
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("programme", id.toString()), etudiant))
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void v03_ilFautUneOffreEtUnProgrammeOuvertPourParticiper() throws Exception {
        UUID id = creer(personnel, "Orientation", "Étape");
        Utilisateur sansOffre = creerUtilisateur(TypeRole.ALUMNI, "SansOffre");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Mentor");
        creerProfil(mentor, true, 2, domaine("DATA_IA"));

        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), mentor))
            .andExpect(status().isNotFound());
        changerStatutProgramme(id, "OUVERT", personnel);
        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), sansOffre))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Proposez d'abord du mentorat (Mon offre) pour participer au programme comme mentor."));
        changerStatutProgramme(id, "EN_COURS", personnel);
        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), mentor))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("On ne rejoint un programme que lorsqu'il est ouvert."));
    }

    private UUID creer(Utilisateur auteur, String titre, String... etapes) throws Exception {
        String[] corps = new String[etapes.length];
        for (int i = 0; i < etapes.length; i++) corps[i] = etape(null, etapes[i]);
        String reponse = envoyer(post("/api/mentorat/programmes"), auteur, programme(titre, corps))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(reponse, "$.id"));
    }

    private ResultActions changerStatutProgramme(UUID id, String statut, Utilisateur auteur) throws Exception {
        return envoyer(patch("/api/mentorat/programmes/{id}/statut", id), auteur, "{\"statut\":\"" + statut + "\"}");
    }

    /** Un mentorat rattaché au programme (le rattachement par la demande arrive au lot 3). */
    private Mentorat rattacherUnMentorat(UUID programmeId) throws Exception {
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Mentor");
        UUID mentoratId = demander(etudiant, creerProfil(mentor, true, 2, data), data);
        Mentorat mentorat = mentoratRepository.findById(mentoratId).orElseThrow();
        mentorat.setProgramme(programmeRepository.findById(programmeId).orElseThrow());
        return mentoratRepository.saveAndFlush(mentorat);
    }

    private static String programme(String titre, String... etapes) {
        return """
            {"titre":"%s","description":"Accompagner les lycéens dans leur orientation.",
             "dateDebut":"2026-11-01","dateFin":"2027-03-31","etapes":[%s]}
            """.formatted(titre, String.join(",", etapes));
    }

    private static String etape(UUID id, String titre) {
        return id == null
            ? "{\"titre\":\"%s\"}".formatted(titre)
            : "{\"id\":\"%s\",\"titre\":\"%s\"}".formatted(id, titre);
    }
}
