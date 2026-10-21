package ept.edu.sn.alumni_backend.mentorat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/** Cas V-* (détail), S-* (séances) et E-* (évaluation) du catalogue. */
@SpringBootTest
@AutoConfigureMockMvc
class MentoratSuiviIntegrationTests extends MentoratTestsBase {
    private Utilisateur mentor;
    private Utilisateur etudiant;
    private Utilisateur intrus;
    private UUID data;
    private UUID mentorat;

    @BeforeEach
    void preparer() throws Exception {
        mentor = creerUtilisateur(TypeRole.ALUMNI, "Diop");
        etudiant = creerUtilisateur(TypeRole.ETUDIANT, "Ndiaye");
        intrus = creerUtilisateur(TypeRole.ALUMNI, "Sow");
        data = domaine("DATA_IA");
        mentorat = demander(etudiant, creerProfil(mentor, true, 2, data), data);
    }

    // ---------- Détail ----------

    @Test
    void v01_seulsLesDeuxParticipantsVoientLeDetailAvecLeurRole() throws Exception {
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.mentorat.monRole").value("MENTORE"))
            .andExpect(jsonPath("$.seances.length()").value(0))
            .andExpect(jsonPath("$.peutEvaluer").value(false));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), mentor))
            .andExpect(jsonPath("$.mentorat.monRole").value("MENTOR"));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), intrus))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Ce mentorat est introuvable."));
    }

    @Test
    void v02_leDetailNExposePasLesCoordonneesDesParticipants() throws Exception {
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), etudiant))
            .andExpect(jsonPath("$.mentorat.mentor.email").doesNotExist())
            .andExpect(jsonPath("$.mentorat.mentor.telephone").doesNotExist())
            .andExpect(jsonPath("$.mentorat.mentore.email").doesNotExist());
    }

    // ---------- Séances ----------

    @Test
    void s01_aucuneSeanceAvantLAcceptation() throws Exception {
        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), mentor, seance(45))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Les séances se gèrent uniquement pendant un mentorat en cours."));
    }

    @Test
    void s02_lesDeuxParticipantsPlanifientEtLesSeancesSontTrieesDeLaPlusRecente() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        planifier(mentorat, mentor);
        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), etudiant, """
            {"debut":"%s","dureeMinutes":30,"modalite":"PRESENTIEL","lieuOuLien":"Bibliothèque"}
            """.formatted(Instant.now().plusSeconds(10 * 86_400)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("PLANIFIEE"))
            .andExpect(jsonPath("$.proposeeParId").value(etudiant.getId().toString()));

        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), mentor))
            .andExpect(jsonPath("$.seances.length()").value(2))
            .andExpect(jsonPath("$.seances[0].modalite").value("PRESENTIEL"));
        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), intrus, seance(45))
            .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"debut\":\"%1$s\",\"dureeMinutes\":14,\"modalite\":\"VISIO\"}",
        "{\"debut\":\"%1$s\",\"dureeMinutes\":241,\"modalite\":\"VISIO\"}",
        "{\"dureeMinutes\":45,\"modalite\":\"VISIO\"}",
        "{\"debut\":\"%1$s\",\"dureeMinutes\":45}",
        "{\"debut\":\"%1$s\",\"dureeMinutes\":45,\"modalite\":\"PIGEON\"}",
        "{\"debut\":\"pas-une-date\",\"dureeMinutes\":45,\"modalite\":\"VISIO\"}",
    })
    void s03_uneSeanceInvalideEstRefusee(String corps) throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), mentor,
                corps.formatted(Instant.now().plusSeconds(3600)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void s04_lesDureesLimitesEtUnLieuDeCinqCentsCaracteresSontAcceptes() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), mentor, seance(15)).andExpect(status().isCreated());
        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), mentor, seance(240)).andExpect(status().isCreated());
        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), mentor, """
            {"debut":"%s","dureeMinutes":45,"modalite":"TELEPHONE","lieuOuLien":"%s"}
            """.formatted(Instant.now(), "a".repeat(501)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void s05_uneSeanceRealiseeGardeSonCompteRenduEtPeutEtreCompletee() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        UUID seance = planifier(mentorat, mentor);
        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), etudiant,
                "{\"statut\":\"REALISEE\",\"compteRendu\":\"  CV relu.  \"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("REALISEE"))
            .andExpect(jsonPath("$.compteRendu").value("CV relu."));
        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), mentor,
                "{\"statut\":\"REALISEE\",\"compteRendu\":\"CV relu, candidatures ciblées.\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.compteRendu").value("CV relu, candidatures ciblées."));
        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), mentor, "{\"statut\":\"ANNULEE\"}")
            .andExpect(status().isConflict());
    }

    @Test
    void s06_uneSeanceAnnuleeNAPasDeCompteRenduEtNeRevientPas() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        UUID seance = planifier(mentorat, mentor);
        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), mentor,
                "{\"statut\":\"ANNULEE\",\"compteRendu\":\"texte\"}")
            .andExpect(status().isBadRequest());
        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), mentor, "{\"statut\":\"ANNULEE\"}")
            .andExpect(status().isOk());
        for (String statut : new String[] {"PLANIFIEE", "REALISEE"}) {
            envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), mentor,
                    "{\"statut\":\"" + statut + "\"}")
                .andExpect(status().isConflict());
        }
    }

    @Test
    void s07_uneSeanceDUnAutreMentoratOuUnCompteRenduTropLongSontRefuses() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        UUID seance = planifier(mentorat, mentor);
        Utilisateur autreEtudiant = creerUtilisateur(TypeRole.ETUDIANT, "Fall");
        UUID autreMentorat = demander(autreEtudiant, profilMentorRepository.findByUtilisateur_Id(mentor.getId())
            .orElseThrow().getId(), data);
        changerStatut(autreMentorat, "accepter", mentor);

        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", autreMentorat, seance), mentor,
                "{\"statut\":\"REALISEE\"}")
            .andExpect(status().isNotFound());
        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), mentor,
                "{\"statut\":\"REALISEE\",\"compteRendu\":\"" + "a".repeat(4001) + "\"}")
            .andExpect(status().isBadRequest());
    }

    @Test
    void s08_apresLaClotureLesSeancesNeSeModifientPlus() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        UUID seance = planifier(mentorat, mentor);
        changerStatut(mentorat, "terminer", etudiant);

        envoyer(post("/api/mentorat/mentorats/{id}/seances", mentorat), mentor, seance(45))
            .andExpect(status().isConflict());
        envoyer(patch("/api/mentorat/mentorats/{id}/seances/{s}", mentorat, seance), mentor, "{\"statut\":\"REALISEE\"}")
            .andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), mentor))
            .andExpect(jsonPath("$.seances[0].statut").value("PLANIFIEE"));
    }

    // ---------- Évaluation ----------

    @Test
    void e01_onNEvalueQuUnMentoratTermine() throws Exception {
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), etudiant, "{\"note\":5}")
            .andExpect(status().isConflict());
        changerStatut(mentorat, "accepter", mentor);
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), etudiant, "{\"note\":5}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Un mentorat s'évalue une fois terminé."));
    }

    @Test
    void e02_chaqueParticipantEvalueUneFoisEtLesTiersNePeuventPas() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        changerStatut(mentorat, "terminer", mentor);

        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), etudiant))
            .andExpect(jsonPath("$.peutEvaluer").value(true));
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), etudiant,
                "{\"note\":5,\"commentaire\":\"  Très utile  \"}")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.commentaire").value("Très utile"));
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), etudiant, "{\"note\":4}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez déjà évalué ce mentorat."));
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), mentor, "{\"note\":4}")
            .andExpect(status().isCreated());
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), intrus, "{\"note\":4}")
            .andExpect(status().isNotFound());

        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), etudiant))
            .andExpect(jsonPath("$.peutEvaluer").value(false))
            .andExpect(jsonPath("$.evaluations.length()").value(2));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"note\":0}", "{\"note\":6}", "{}"})
    void e03_uneNoteHorsDeUnACinqEstRefusee(String corps) throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        changerStatut(mentorat, "terminer", mentor);
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), etudiant, corps)
            .andExpect(status().isBadRequest());
    }

    @Test
    void e04_unCommentaireTropLongEstRefuse() throws Exception {
        changerStatut(mentorat, "accepter", mentor);
        changerStatut(mentorat, "terminer", mentor);
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), etudiant,
                "{\"note\":3,\"commentaire\":\"" + "a".repeat(1001) + "\"}")
            .andExpect(status().isBadRequest());
    }

    @Test
    void e05_unMentoratAnnuleOuRefuseNeSEvaluePas() throws Exception {
        changerStatut(mentorat, "annuler", etudiant);
        envoyer(post("/api/mentorat/mentorats/{id}/evaluation", mentorat), etudiant, "{\"note\":3}")
            .andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/{id}", mentorat), etudiant))
            .andExpect(jsonPath("$.peutEvaluer").value(false));
    }
}
