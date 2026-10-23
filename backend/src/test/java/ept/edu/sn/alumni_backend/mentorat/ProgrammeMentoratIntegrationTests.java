package ept.edu.sn.alumni_backend.mentorat;

import static org.assertj.core.api.Assertions.assertThat;
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
import java.time.LocalDate;
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

/** Cas G-* (gestion, lot 1), V-* (programme visible et mentors volontaires, lot 2) D-* (demande rattachée, lot 3), E-* (étapes dans le suivi, lot 4) et T-* (tableau de bord, lot 5). */
@SpringBootTest
@AutoConfigureMockMvc
class ProgrammeMentoratIntegrationTests extends MentoratTestsBase {
    private static final String MESSAGE_ROLE = "Les programmes sont créés et gérés par l'administration.";

    /** Administrateur qui crée les programmes des tests. */
    private Utilisateur gestionnaire;
    private Utilisateur autreAdmin;
    private Utilisateur admin;
    private Utilisateur personnel;
    private Utilisateur etudiant;

    @BeforeEach
    void preparer() {
        gestionnaire = creerUtilisateur(TypeRole.ADMIN, "Faye");
        autreAdmin = creerUtilisateur(TypeRole.ADMIN, "Ka");
        personnel = creerUtilisateur(TypeRole.PERSONNEL, "Personnel");
        admin = creerUtilisateur(TypeRole.ADMIN, "Admin");
        etudiant = creerUtilisateur(TypeRole.ETUDIANT, "Ndiaye");
    }

    @Test
    void g01_lAdministrationCreeUnBrouillonAvecSesEtapesDansLOrdre() throws Exception {
        envoyer(post("/api/mentorat/programmes"), gestionnaire, programme("  Orientation lycée 2026  ",
                etape(null, "Premier échange"), etape(null, "Visite de l'EPT"), etape(null, "Choix de filière")))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", containsString("/api/mentorat/programmes/")))
            .andExpect(jsonPath("$.titre").value("Orientation lycée 2026"))
            .andExpect(jsonPath("$.statut").value("BROUILLON"))
            .andExpect(jsonPath("$.responsable.id").value(gestionnaire.getId().toString()))
            .andExpect(jsonPath("$.responsable.email").doesNotExist())
            .andExpect(jsonPath("$.etapes[*].titre").value(contains("Premier échange", "Visite de l'EPT", "Choix de filière")))
            .andExpect(jsonPath("$.etapes[*].ordre").value(contains(1, 2, 3)))
            .andExpect(jsonPath("$.nombreMentorats").value(0))
            .andExpect(jsonPath("$.gerable").value(true));
    }

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"PERSONNEL", "ETUDIANT", "ALUMNI", "VISITEUR", "ORGANISME"})
    void g02_seuleLAdministrationCreeEtGereLesProgrammes(TypeRole role) throws Exception {
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
        envoyer(post("/api/mentorat/programmes"), gestionnaire, corps).andExpect(status().isBadRequest());
    }

    @Test
    void g04_auPlusDixEtapesEtPasDEtapeExistanteDansUnNouveauProgramme() throws Exception {
        String[] onze = new String[11];
        for (int i = 0; i < onze.length; i++) onze[i] = etape(null, "Étape " + i);
        envoyer(post("/api/mentorat/programmes"), gestionnaire, programme("Programme", onze))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/mentorat/programmes"), gestionnaire, programme("Programme", etape(UUID.randomUUID(), "Étape")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void g05_unBrouillonNExistePasHorsDeLAdministrationQuiLeGereEnEntier() throws Exception {
        UUID id = creer(gestionnaire, "Brouillon", "Étape");

        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), personnel)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant)).andExpect(status().isNotFound());
        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Pris", etape(null, "Étape")))
            .andExpect(status().isNotFound());

        // Un autre administrateur gère aussi ce programme.
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.gerable").value(true));
        creer(autreAdmin, "Autre", "Étape");
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/geres"), gestionnaire))
            .andExpect(jsonPath("$[*].titre").value(contains("Autre", "Brouillon")));

        // Ouvert, le programme se consulte mais ne se gère pas hors de l'administration.
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), personnel))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.gerable").value(false));
        envoyer(put("/api/mentorat/programmes/{id}", id), personnel, programme("Pris", etape(null, "Étape")))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Seule l'administration peut gérer ce programme."));
    }

    @Test
    void g06_modifierReordonneRenommeAjouteEtRetireLesEtapesEnGardantLeursIdentifiants() throws Exception {
        String reponse = envoyer(post("/api/mentorat/programmes"), gestionnaire,
                programme("Programme", etape(null, "A"), etape(null, "B"), etape(null, "C")))
            .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(JsonPath.read(reponse, "$.id"));
        List<String> ids = JsonPath.read(reponse, "$.etapes[*].id");

        envoyer(put("/api/mentorat/programmes/{id}", id), gestionnaire, programme("Programme revu",
                etape(UUID.fromString(ids.get(2)), "C renommée"), etape(null, "D"), etape(UUID.fromString(ids.get(0)), "A")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.titre").value("Programme revu"))
            .andExpect(jsonPath("$.etapes[*].titre").value(contains("C renommée", "D", "A")))
            .andExpect(jsonPath("$.etapes[0].id").value(ids.get(2)))
            .andExpect(jsonPath("$.etapes[2].id").value(ids.get(0)))
            .andExpect(jsonPath("$.etapes[*].ordre").value(contains(1, 2, 3)));

        UUID etrangere = UUID.fromString(JsonPath.read(envoyer(post("/api/mentorat/programmes"), gestionnaire,
            programme("Autre", etape(null, "X"))).andReturn().getResponse().getContentAsString(), "$.etapes[0].id"));
        envoyer(put("/api/mentorat/programmes/{id}", id), gestionnaire, programme("Programme", etape(etrangere, "X")))
            .andExpect(status().isBadRequest());
        envoyer(put("/api/mentorat/programmes/{id}", id), gestionnaire, programme("Programme",
                etape(UUID.fromString(ids.get(0)), "A"), etape(UUID.fromString(ids.get(0)), "A bis")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void g07_cycleDeVieOuvertureEnCoursClotureEtProgrammeFige() throws Exception {
        UUID vide = creer(gestionnaire, "Sans étape");
        changerStatutProgramme(vide, "OUVERT", gestionnaire)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ajoutez au moins une étape avant d'ouvrir le programme."));

        UUID id = creer(gestionnaire, "Orientation", "Premier échange");
        changerStatutProgramme(id, "OUVERT", gestionnaire).andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("OUVERT"));
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.gerable").value(false));
        envoyer(put("/api/mentorat/programmes/{id}", id), etudiant, programme("Pris", etape(null, "X")))
            .andExpect(status().isForbidden());
        envoyer(put("/api/mentorat/programmes/{id}", id), gestionnaire, programme("Orientation"))
            .andExpect(status().isConflict());

        changerStatutProgramme(id, "EN_COURS", gestionnaire).andExpect(status().isOk());
        changerStatutProgramme(id, "CLOS", admin).andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("CLOS"));
        changerStatutProgramme(id, "OUVERT", gestionnaire)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce programme ne peut pas passer de « Clos » à « Ouvert »."));
        envoyer(put("/api/mentorat/programmes/{id}", id), gestionnaire, programme("Orientation", etape(null, "X")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Un programme clos ne se modifie plus."));
    }

    @Test
    void g08_unProgrammeSuiviParUnMentoratNeRedevientPasBrouillonEtNeSeSupprimePas() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Premier échange");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        rattacherUnMentorat(id);

        changerStatutProgramme(id, "BROUILLON", gestionnaire)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Des mentorats suivent déjà ce programme : il ne peut plus redevenir un brouillon."));
        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}", id), gestionnaire)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), gestionnaire))
            .andExpect(jsonPath("$.nombreMentorats").value(1));
    }

    @Test
    void g09_seulUnBrouillonSansMentoratSeSupprime() throws Exception {
        UUID id = creer(gestionnaire, "À jeter", "Étape");
        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}", id), personnel)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}", id), gestionnaire)).andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), gestionnaire)).andExpect(status().isNotFound());
    }

    @Test
    void g10_uneEtapeDejaFranchieNePeutPlusEtreRetiree() throws Exception {
        String reponse = envoyer(post("/api/mentorat/programmes"), gestionnaire,
                programme("Orientation", etape(null, "Premier échange"), etape(null, "Visite")))
            .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(JsonPath.read(reponse, "$.id"));
        List<String> ids = JsonPath.read(reponse, "$.etapes[*].id");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        Mentorat mentorat = rattacherUnMentorat(id);
        ProgressionJalon progression = new ProgressionJalon();
        progression.setMentorat(mentorat);
        progression.setJalon(jalonRepository.findById(UUID.fromString(ids.get(0))).orElseThrow());
        progression.setAtteintLe(Instant.now());
        progression.setValidePar(etudiant);
        progressionRepository.saveAndFlush(progression);

        envoyer(put("/api/mentorat/programmes/{id}", id), gestionnaire, programme("Orientation", etape(UUID.fromString(ids.get(1)), "Visite")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Une étape déjà franchie par un mentorat ne peut pas être retirée."));
        // Renommer ou retirer une étape encore jamais franchie reste possible.
        envoyer(put("/api/mentorat/programmes/{id}", id), gestionnaire, programme("Orientation", etape(UUID.fromString(ids.get(0)), "Premier contact")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.etapes[*].titre").value(contains("Premier contact")));
    }

    // ---------- Lot 2 : programme visible et mentors volontaires ----------

    @Test
    void v01_seulsLesProgrammesOuvertsSontProposesATousLesMembres() throws Exception {
        UUID ouvert = creer(gestionnaire, "Orientation", "Étape");
        changerStatutProgramme(ouvert, "OUVERT", gestionnaire);
        creer(gestionnaire, "Brouillon", "Étape");
        UUID enCours = creer(autreAdmin, "Insertion", "Étape");
        changerStatutProgramme(enCours, "OUVERT", autreAdmin);
        changerStatutProgramme(enCours, "EN_COURS", autreAdmin);

        mockMvc.perform(authentifie(get("/api/mentorat/programmes/ouverts"), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].titre").value(contains("Orientation")))
            .andExpect(jsonPath("$[0].gerable").value(false))
            .andExpect(jsonPath("$[0].nombreMentors").value(0));
    }

    @Test
    void v02_unMembreAvecUneOffreDevientMentorVolontairePuisSeRetire() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
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
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        Utilisateur sansOffre = creerUtilisateur(TypeRole.ALUMNI, "SansOffre");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Mentor");
        creerProfil(mentor, true, 2, domaine("DATA_IA"));

        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), mentor))
            .andExpect(status().isNotFound());
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), sansOffre))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Proposez d'abord du mentorat (Mon offre) pour participer au programme comme mentor."));
        changerStatutProgramme(id, "EN_COURS", gestionnaire);
        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), mentor))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("On ne rejoint un programme que lorsqu'il est ouvert."));
    }

    // ---------- Lot 3 : demande rattachée au programme ----------

    @Test
    void d01_uneDemandeFaiteDepuisLeProgrammeLuiEstRattachee() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Volontaire");
        UUID profilId = creerProfil(mentor, true, 2, data);
        participer(id, mentor);

        String reponse = envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilId, data, id))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.programme.id").value(id.toString()))
            .andExpect(jsonPath("$.programme.titre").value("Orientation"))
            .andReturn().getResponse().getContentAsString();
        UUID mentoratId = UUID.fromString(JsonPath.read(reponse, "$.id"));

        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "MENTOR"), mentor))
            .andExpect(jsonPath("$.contenu[0].programme.titre").value("Orientation"));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentoratId), etudiant))
            .andExpect(jsonPath("$.mentorat.programme.id").value(id.toString()));
        // Une demande libre au même mentor reste possible ailleurs, sans programme.
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "MENTORE"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void d02_leProgrammeDoitEtreOuvertEtLeMentorVolontaire() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        UUID data = domaine("DATA_IA");
        Utilisateur volontaire = creerUtilisateur(TypeRole.ALUMNI, "Volontaire");
        UUID profilVolontaire = creerProfil(volontaire, true, 2, data);
        Utilisateur horsProgramme = creerUtilisateur(TypeRole.ALUMNI, "Libre");
        UUID profilLibre = creerProfil(horsProgramme, true, 2, data);

        envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilVolontaire, data, id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Ce programme est introuvable."));
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        participer(id, volontaire);
        envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilLibre, data, id))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce mentor ne participe pas à ce programme."));
        changerStatutProgramme(id, "EN_COURS", gestionnaire);
        envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilVolontaire, data, id))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce programme n'accepte plus de nouvelles demandes."));
        envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilVolontaire, data, UUID.randomUUID()))
            .andExpect(status().isNotFound());
        assertThat(mentoratRepository.count()).isZero();
    }

    @Test
    void d03_unProgrammeSuiviParUneDemandeNeSeSupprimePlus() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Volontaire");
        UUID profilId = creerProfil(mentor, true, 2, data);
        participer(id, mentor);
        envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilId, data, id))
            .andExpect(status().isCreated());

        changerStatutProgramme(id, "BROUILLON", gestionnaire)
            .andExpect(status().isConflict());
    }

    // ---------- Lot 4 : étapes dans le suivi ----------

    @Test
    void e01_mentorEtMentoreValidentLesEtapesDansNImporteQuelOrdre() throws Exception {
        MentoratDeProgramme m = mentoratDeProgramme("Premier échange", "Visite de l'EPT");
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", m.mentoratId()), etudiant))
            .andExpect(jsonPath("$.etapes[*].titre").value(contains("Premier échange", "Visite de l'EPT")))
            .andExpect(jsonPath("$.etapes[0].franchieLe").doesNotExist());

        envoyer(put("/api/mentorat/mentorats/{id}/etapes/{etape}", m.mentoratId(), m.etapes().get(1)), etudiant,
                "{\"commentaire\":\"  Visite faite avec ma classe.  \"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.franchieLe").exists())
            .andExpect(jsonPath("$.valideePar").value(etudiant.getPrenom() + " " + etudiant.getNom()))
            .andExpect(jsonPath("$.commentaire").value("Visite faite avec ma classe."));
        // Sans corps, puis une seconde fois : la première validation fait foi.
        mockMvc.perform(authentifie(put("/api/mentorat/mentorats/{id}/etapes/{etape}", m.mentoratId(), m.etapes().get(0)), m.mentor()))
            .andExpect(status().isOk());
        envoyer(put("/api/mentorat/mentorats/{id}/etapes/{etape}", m.mentoratId(), m.etapes().get(0)), etudiant, "{}")
            .andExpect(jsonPath("$.valideePar").value(m.mentor().getPrenom() + " " + m.mentor().getNom()));
        assertThat(progressionRepository.count()).isEqualTo(2);

        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", m.mentoratId()), m.mentor()))
            .andExpect(jsonPath("$.etapes[0].franchieLe").exists())
            .andExpect(jsonPath("$.etapes[1].commentaire").value("Visite faite avec ma classe."));

        mockMvc.perform(authentifie(delete("/api/mentorat/mentorats/{id}/etapes/{etape}", m.mentoratId(), m.etapes().get(1)), m.mentor()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.franchieLe").doesNotExist());
        assertThat(progressionRepository.count()).isEqualTo(1);
    }

    @Test
    void e02_unMentoratLibreNAPasDEtapes() throws Exception {
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Libre");
        UUID mentoratId = demander(etudiant, creerProfil(mentor, true, 2, data), data);
        changerStatut(mentoratId, "accepter", mentor);
        MentoratDeProgramme autre = mentoratDeProgramme("Étape");

        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentoratId), etudiant))
            .andExpect(jsonPath("$.etapes").isEmpty());
        mockMvc.perform(authentifie(put("/api/mentorat/mentorats/{id}/etapes/{etape}", mentoratId, autre.etapes().get(0)), etudiant))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Cette étape est introuvable."));
    }

    @Test
    void e03_lesEtapesSeValidentPendantLeMentoratEtSeulementParSesParticipants() throws Exception {
        MentoratDeProgramme m = mentoratDeProgramme("Étape");
        UUID etape = m.etapes().get(0);
        mockMvc.perform(authentifie(put("/api/mentorat/mentorats/{id}/etapes/{etape}", m.mentoratId(), etape), gestionnaire))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(put("/api/mentorat/mentorats/{id}/etapes/{etape}", m.mentoratId(), UUID.randomUUID()), etudiant))
            .andExpect(status().isNotFound());

        changerStatutProgramme(m.programmeId(), "CLOS", gestionnaire).andExpect(status().isOk());
        mockMvc.perform(authentifie(put("/api/mentorat/mentorats/{id}/etapes/{etape}", m.mentoratId(), etape), etudiant))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce programme est clos : ses étapes ne se valident plus."));

        MentoratDeProgramme termine = mentoratDeProgramme("Étape");
        changerStatut(termine.mentoratId(), "terminer", termine.mentor());
        mockMvc.perform(authentifie(put("/api/mentorat/mentorats/{id}/etapes/{etape}", termine.mentoratId(), termine.etapes().get(0)), etudiant))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Les étapes se valident uniquement pendant un mentorat en cours."));
        assertThat(progressionRepository.count()).isZero();
    }

    // ---------- Lot 5 : tableau de bord de l'administration ----------

    @Test
    void t01_leTableauDeBordResumeMentoratsEtapesEtMentorsSansLeurContenu() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Premier échange", "Visite");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        UUID data = domaine("DATA_IA");
        Utilisateur mentorA = creerUtilisateur(TypeRole.ALUMNI, "MentorA");
        UUID profilA = creerProfil(mentorA, true, 3, data);
        Utilisateur mentorB = creerUtilisateur(TypeRole.ETUDIANT, "MentorB");
        UUID profilB = creerProfil(mentorB, true, 3, data);
        participer(id, mentorA);
        participer(id, mentorB);
        List<String> etapes = JsonPath.read(mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant))
            .andReturn().getResponse().getContentAsString(), "$.etapes[*].id");

        UUID enCours = demanderDansProgramme(etudiant, profilA, data, id);
        changerStatut(enCours, "accepter", mentorA);
        validerEtape(enCours, etapes.get(0), etudiant);
        demanderDansProgramme(creerUtilisateur(TypeRole.VISITEUR, "Lyceenne"), profilA, data, id);
        UUID termine = demanderDansProgramme(creerUtilisateur(TypeRole.ETUDIANT, "Termine"), profilB, data, id);
        changerStatut(termine, "accepter", mentorB);
        validerEtape(termine, etapes.get(0), mentorB);
        validerEtape(termine, etapes.get(1), mentorB);
        changerStatut(termine, "terminer", mentorB);
        changerStatut(demanderDansProgramme(creerUtilisateur(TypeRole.ALUMNI, "Refuse"), profilB, data, id), "refuser", mentorB);

        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}/tableau", id), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.enAttente").value(1))
            .andExpect(jsonPath("$.enCours").value(1))
            .andExpect(jsonPath("$.terminees").value(1))
            .andExpect(jsonPath("$.sansSuite").value(1))
            // 3 étapes franchies sur 2 mentorats suivis × 2 étapes.
            .andExpect(jsonPath("$.progressionMoyenne").value(75))
            .andExpect(jsonPath("$.etapes[*].franchies").value(contains(2, 1)))
            .andExpect(jsonPath("$.etapes[0].suivis").value(2))
            .andExpect(jsonPath("$.mentorats.length()").value(4))
            .andExpect(jsonPath("$.mentorats[?(@.id == '%s')].etapesFranchies".formatted(termine)).value(contains(2)))
            .andExpect(jsonPath("$.mentorats[?(@.id == '%s')].mentor.id".formatted(enCours)).value(contains(mentorA.getId().toString())))
            .andExpect(jsonPath("$.mentorats[0].objectif").doesNotExist())
            .andExpect(jsonPath("$.mentorats[0].mentore.email").doesNotExist())
            .andExpect(jsonPath("$.mentors[*].mentor.id").value(contains(mentorA.getId().toString(), mentorB.getId().toString())))
            .andExpect(jsonPath("$.mentors[*].mentoresEnCours").value(contains(1, 0)));
    }

    @Test
    void t02_seuleLAdministrationConsulteLeTableauDeBord() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}/tableau", id), personnel)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}/tableau", id), autreAdmin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.progressionMoyenne").value(0))
            .andExpect(jsonPath("$.mentorats").isEmpty())
            .andExpect(jsonPath("$.etapes[0].suivis").value(0));

        changerStatutProgramme(id, "OUVERT", gestionnaire);
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}/tableau", id), personnel))
            .andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}/tableau", id), etudiant))
            .andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}/tableau", UUID.randomUUID()), admin))
            .andExpect(status().isNotFound());
    }

    // ---------- Dates du programme et départ d'un mentor ----------

    @Test
    void f01_unProgrammeTermineNAccepteNiDemandeNiMentorEtSortDesProgrammesOuverts() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Volontaire");
        UUID profilId = creerProfil(mentor, true, 2, data);
        participer(id, mentor);
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant))
            .andExpect(jsonPath("$.termine").value(false));

        // La période est passée (les dates d'une requête ne peuvent pas être antérieures : on les pose en base).
        var programme = programmeRepository.findById(id).orElseThrow();
        programme.setDateDebut(LocalDate.of(2025, 9, 1));
        programme.setDateFin(LocalDate.of(2026, 6, 30));
        programmeRepository.saveAndFlush(programme);

        mockMvc.perform(authentifie(get("/api/mentorat/programmes/ouverts"), etudiant))
            .andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(authentifie(get("/api/mentorat/programmes/geres"), gestionnaire))
            .andExpect(jsonPath("$[0].termine").value(true))
            .andExpect(jsonPath("$[0].statut").value("OUVERT"));
        envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilId, data, id))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce programme est terminé depuis le 30 juin 2026 : il n'accepte plus de nouvelles demandes."));
        Utilisateur retardataire = creerUtilisateur(TypeRole.ALUMNI, "Retard");
        creerProfil(retardataire, true, 2, data);
        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", id), retardataire))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce programme est terminé depuis le 30 juin 2026 : on ne le rejoint plus."));
        // Une demande libre au même mentor reste possible.
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profilId, data)).andExpect(status().isCreated());
    }

    @Test
    void f02_leMentorQuiQuitteLeProgrammeAnnuleSesDemandesEnAttenteDuProgrammeSeulement() throws Exception {
        UUID id = creer(gestionnaire, "Orientation", "Étape");
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Partant");
        UUID profilId = creerProfil(mentor, true, 3, data);
        participer(id, mentor);
        UUID enAttente = demanderDansProgramme(etudiant, profilId, data, id);
        UUID acceptee = demanderDansProgramme(creerUtilisateur(TypeRole.ETUDIANT, "Acceptee"), profilId, data, id);
        changerStatut(acceptee, "accepter", mentor);
        UUID libre = demander(creerUtilisateur(TypeRole.VISITEUR, "Libre"), profilId, data);

        mockMvc.perform(authentifie(delete("/api/mentorat/programmes/{id}/participation", id), mentor))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jeParticipe").value(false));

        assertThat(mentoratRepository.findById(enAttente).orElseThrow().getStatut()).isEqualTo(StatutMentorat.ANNULEE);
        assertThat(mentoratRepository.findById(enAttente).orElseThrow().getClotureLe()).isNotNull();
        assertThat(mentoratRepository.findById(acceptee).orElseThrow().getStatut()).isEqualTo(StatutMentorat.ACCEPTEE);
        assertThat(mentoratRepository.findById(libre).orElseThrow().getStatut()).isEqualTo(StatutMentorat.EN_ATTENTE);
        // Le mentoré peut solliciter un autre mentor du programme : sa demande n'est plus en cours.
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/compteurs"), etudiant))
            .andExpect(jsonPath("$.demandesEnvoyeesEnAttente").value(0));
    }

    private UUID demanderDansProgramme(Utilisateur mentore, UUID profilId, UUID domaineId, UUID programmeId) throws Exception {
        String reponse = envoyer(post("/api/mentorat/mentorats"), mentore, demandeDansProgramme(profilId, domaineId, programmeId))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(reponse, "$.id"));
    }

    private void validerEtape(UUID mentoratId, String etapeId, Utilisateur auteur) throws Exception {
        mockMvc.perform(authentifie(put("/api/mentorat/mentorats/{id}/etapes/{etape}", mentoratId, etapeId), auteur))
            .andExpect(status().isOk());
    }

    private record MentoratDeProgramme(UUID programmeId, UUID mentoratId, Utilisateur mentor, List<UUID> etapes) {
    }

    /** Programme ouvert, mentor volontaire, demande de l'étudiant faite dans le programme et acceptée. */
    private MentoratDeProgramme mentoratDeProgramme(String... etapes) throws Exception {
        UUID id = creer(gestionnaire, "Orientation", etapes);
        changerStatutProgramme(id, "OUVERT", gestionnaire);
        UUID data = domaine("DATA_IA");
        Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "Volontaire");
        UUID profilId = creerProfil(mentor, true, 2, data);
        participer(id, mentor);
        String reponse = envoyer(post("/api/mentorat/mentorats"), etudiant, demandeDansProgramme(profilId, data, id))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        UUID mentoratId = UUID.fromString(JsonPath.read(reponse, "$.id"));
        changerStatut(mentoratId, "accepter", mentor);
        String programme = mockMvc.perform(authentifie(get("/api/mentorat/programmes/{id}", id), etudiant))
            .andReturn().getResponse().getContentAsString();
        List<String> ids = JsonPath.read(programme, "$.etapes[*].id");
        return new MentoratDeProgramme(id, mentoratId, mentor, ids.stream().map(UUID::fromString).toList());
    }

    private void participer(UUID programmeId, Utilisateur mentor) throws Exception {
        mockMvc.perform(authentifie(post("/api/mentorat/programmes/{id}/participation", programmeId), mentor))
            .andExpect(status().isOk());
    }

    private static String demandeDansProgramme(UUID profilId, UUID domaineId, UUID programmeId) {
        return """
            {"profilMentorId":"%s","domaineId":"%s","objectif":"M'orienter","programmeId":"%s"}
            """.formatted(profilId, domaineId, programmeId);
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

    /** Un mentorat rattaché au programme directement en base, sans passer par les règles de la demande. */
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
