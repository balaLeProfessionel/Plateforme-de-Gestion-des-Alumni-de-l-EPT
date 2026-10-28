package ept.edu.sn.alumni_backend.mentorat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/** Cas D-* (demande), L-* (listes et compteur) et T-* (changements de statut) du catalogue. */
@SpringBootTest
@AutoConfigureMockMvc
class MentoratDemandesIntegrationTests extends MentoratTestsBase {
    private Utilisateur mentor;
    private Utilisateur etudiant;
    private Utilisateur autreEtudiant;
    private Utilisateur intrus;
    private UUID data;
    private UUID carriere;
    private UUID profilId;

    @BeforeEach
    void preparer() throws Exception {
        mentor = creerUtilisateur(TypeRole.ALUMNI, "Diop");
        etudiant = creerUtilisateur(TypeRole.ETUDIANT, "Ndiaye");
        autreEtudiant = creerUtilisateur(TypeRole.ETUDIANT, "Fall");
        intrus = creerUtilisateur(TypeRole.ETUDIANT, "Sow");
        data = domaine("DATA_IA");
        carriere = domaine("CARRIERE_INSERTION");
        profilId = creerProfil(mentor, true, 1, data);
    }

    // ---------- Demande ----------

    @Test
    void d01_unEtudiantEnvoieUneDemandeEnAttente() throws Exception {
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profilId, data))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", Matchers.startsWith("/api/mentorat/mentorats/")))
            .andExpect(jsonPath("$.statut").value("EN_ATTENTE"))
            .andExpect(jsonPath("$.monRole").value("MENTORE"))
            .andExpect(jsonPath("$.domaine.code").value("DATA_IA"))
            .andExpect(jsonPath("$.mentor.id").value(mentor.getId().toString()))
            .andExpect(jsonPath("$.reponduLe").doesNotExist());
    }

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"ORGANISME", "ADMIN"})
    void d02_lesComptesDOrganismeOuDAdministrationNeDemandentPasDeMentorat(TypeRole role) throws Exception {
        envoyer(post("/api/mentorat/mentorats"), creerUtilisateur(role, "Membre"), demande(profilId, data))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Le mentorat est réservé aux membres : étudiants, alumni, personnel et visiteurs."));
    }

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"ETUDIANT", "ALUMNI", "PERSONNEL", "VISITEUR"})
    void d11_toutMembrePeutEtreMentoreAupresDeToutMembre(TypeRole role) throws Exception {
        // Ex. un lycéen (visiteur) auprès d'un étudiant, ou un jeune alumni auprès d'un ancien.
        UUID profilEtudiant = creerProfil(autreEtudiant, true, 2, data);
        envoyer(post("/api/mentorat/mentorats"), creerUtilisateur(role, "Membre"), demande(profilEtudiant, data))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("EN_ATTENTE"))
            .andExpect(jsonPath("$.mentor.role").value("ETUDIANT"))
            .andExpect(jsonPath("$.mentore.role").value(role.name()));
    }

    @Test
    void d12_auPlusTroisDemandesEnAttenteToutesMentorsConfondus() throws Exception {
        Utilisateur[] mentors = new Utilisateur[4];
        UUID[] profils = new UUID[4];
        for (int i = 0; i < profils.length; i++) {
            mentors[i] = creerUtilisateur(TypeRole.ALUMNI, "Mentor" + i);
            profils[i] = creerProfil(mentors[i], true, 2, data);
        }
        UUID premiere = demander(etudiant, profils[0], data);
        demander(etudiant, profils[1], data);
        demander(etudiant, profils[2], data);
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profils[3], data))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(
                "Vous avez déjà 3 demandes en attente. Attendez une réponse ou annulez-en une avant d'en envoyer une autre."));

        // Une demande acceptée ne compte plus : seules les demandes sans réponse sont limitées.
        changerStatut(premiere, "accepter", mentors[0]);
        demander(etudiant, profils[3], data);
    }

    @Test
    void d03_unMentorInconnuRepond404() throws Exception {
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(UUID.randomUUID(), data))
            .andExpect(status().isNotFound());
    }

    @Test
    void d10_unMentorDontLeCompteNEstPlusActifNePeutPasEtreSollicite() throws Exception {
        mentor.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurRepository.saveAndFlush(mentor);
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profilId, data))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Ce mentor est introuvable."));

        mentor.setStatutCompte(StatutCompte.ACTIF);
        mentor.setEmailVerifie(false);
        utilisateurRepository.saveAndFlush(mentor);
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profilId, data))
            .andExpect(status().isNotFound());
    }

    @Test
    void d04_leDomaineDoitFairePartieDeLOffreDuMentor() throws Exception {
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profilId, carriere))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Ce mentor n'accompagne pas dans ce domaine."));
    }

    @Test
    void d05_unMentorIndisponibleOuCompletNePeutPasEtreSollicite() throws Exception {
        changerStatut(demander(etudiant, profilId, data), "accepter", mentor);
        envoyer(post("/api/mentorat/mentorats"), autreEtudiant, demande(profilId, data))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce mentor n'est pas disponible pour le moment."));

        Utilisateur pause = creerUtilisateur(TypeRole.ALUMNI, "Pause");
        UUID profilEnPause = creerProfil(pause, false, 3, data);
        envoyer(post("/api/mentorat/mentorats"), autreEtudiant, demande(profilEnPause, data))
            .andExpect(status().isConflict());
    }

    @Test
    void d06_uneSeuleDemandeEnCoursParMentorMaisOnPeutRedemanderApresUnRefus() throws Exception {
        UUID premiere = demander(etudiant, profilId, data);
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profilId, data))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez déjà une demande en cours avec ce mentor."));

        envoyer(patch("/api/mentorat/mentorats/{id}/refuser", premiere), mentor, "{}").andExpect(status().isOk());
        demander(etudiant, profilId, data);
    }

    @Test
    void d07_unEtudiantPeutSolliciterPlusieursMentorsDifferents() throws Exception {
        Utilisateur secondMentor = creerUtilisateur(TypeRole.ALUMNI, "Ba");
        UUID secondProfil = creerProfil(secondMentor, true, 2, data);
        demander(etudiant, profilId, data);
        demander(etudiant, secondProfil, data);
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"profilMentorId\":\"%1$s\",\"domaineId\":\"%2$s\",\"objectif\":\"   \"}",
        "{\"profilMentorId\":\"%1$s\",\"domaineId\":\"%2$s\"}",
        "{\"domaineId\":\"%2$s\",\"objectif\":\"Stage\"}",
        "{\"profilMentorId\":\"%1$s\",\"objectif\":\"Stage\"}",
        "{\"profilMentorId\":\"pas-un-uuid\",\"domaineId\":\"%2$s\",\"objectif\":\"Stage\"}",
    })
    void d08_uneDemandeIncompleteOuMalFormeeEstRefusee(String corps) throws Exception {
        envoyer(post("/api/mentorat/mentorats"), etudiant, corps.formatted(profilId, data))
            .andExpect(status().isBadRequest());
    }

    @Test
    void d09_unObjectifDePlusDeMilleCaracteresEstRefuseEtLObjectifEstNettoye() throws Exception {
        envoyer(post("/api/mentorat/mentorats"), etudiant, """
            {"profilMentorId":"%s","domaineId":"%s","objectif":"%s"}
            """.formatted(profilId, data, "a".repeat(1001)))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/mentorat/mentorats"), etudiant, """
            {"profilMentorId":"%s","domaineId":"%s","objectif":"  Préparer mon stage  "}
            """.formatted(profilId, data))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.objectif").value("Préparer mon stage"));
    }

    // ---------- Listes et compteur ----------

    @Test
    void l01_chacunNeVoitQueSesMentoratsSelonSonRoleEtLesStatutsDemandes() throws Exception {
        UUID enAttente = demander(etudiant, profilId, data);
        demander(autreEtudiant, profilId, data);

        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "MENTORE"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].id").value(enAttente.toString()));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "MENTOR"), mentor))
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.contenu[0].monRole").value("MENTOR"));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "MENTOR")
                .param("statut", "ACCEPTEE", "TERMINEE"), mentor))
            .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "MENTOR"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "MENTORE"), intrus))
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void l02_leRoleEstObligatoireEtDoitEtreValide() throws Exception {
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats"), etudiant)).andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats").param("role", "ADMIN"), etudiant))
            .andExpect(status().isBadRequest());
    }

    @Test
    void l03_leCompteurNeCompteQueLesDemandesRecuesEnAttente() throws Exception {
        UUID premiere = demander(etudiant, profilId, data);
        demander(autreEtudiant, profilId, data);
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/compteurs"), mentor))
            .andExpect(jsonPath("$.demandesRecuesEnAttente").value(2));

        changerStatut(premiere, "accepter", mentor);
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/compteurs"), mentor))
            .andExpect(jsonPath("$.demandesRecuesEnAttente").value(1));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/compteurs"), etudiant))
            .andExpect(jsonPath("$.demandesRecuesEnAttente").value(0))
            .andExpect(jsonPath("$.demandesEnvoyeesEnAttente").value(0))
            .andExpect(jsonPath("$.demandesEnAttenteMax").value(3));
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/compteurs"), autreEtudiant))
            .andExpect(jsonPath("$.demandesEnvoyeesEnAttente").value(1));
    }

    // ---------- Changements de statut ----------

    @Test
    void t01_seulLeMentorAccepteEtLaDateDeReponseEstPosee() throws Exception {
        UUID mentorat = demander(etudiant, profilId, data);
        envoyer(patch("/api/mentorat/mentorats/{id}/accepter", mentorat), etudiant, "{}")
            .andExpect(status().isForbidden());
        envoyer(patch("/api/mentorat/mentorats/{id}/accepter", mentorat), intrus, "{}")
            .andExpect(status().isNotFound());
        envoyer(patch("/api/mentorat/mentorats/{id}/accepter", mentorat), mentor, "{}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ACCEPTEE"))
            .andExpect(jsonPath("$.reponduLe").exists());
    }

    @Test
    void t02_laCapaciteBloqueUneAcceptationDeTrop() throws Exception {
        changerStatut(demander(etudiant, profilId, data), "accepter", mentor);
        envoyer(put("/api/mentorat/profil"), mentor, profil(true, 2, data)).andExpect(status().isOk());
        UUID seconde = demander(autreEtudiant, profilId, data);
        envoyer(put("/api/mentorat/profil"), mentor, profil(true, 1, data)).andExpect(status().isOk());

        envoyer(patch("/api/mentorat/mentorats/{id}/accepter", seconde), mentor, "{}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez atteint votre nombre maximum de mentorés."));
    }

    @Test
    void t03_deuxAcceptationsSimultaneesNeDepassentPasLaCapacite() throws Exception {
        envoyer(put("/api/mentorat/profil"), mentor, profil(true, 2, data)).andExpect(status().isOk());
        UUID premiere = demander(etudiant, profilId, data);
        UUID seconde = demander(autreEtudiant, profilId, data);
        envoyer(put("/api/mentorat/profil"), mentor, profil(true, 1, data)).andExpect(status().isOk());

        ExecutorService executeur = Executors.newFixedThreadPool(2);
        CountDownLatch depart = new CountDownLatch(1);
        try {
            List<Future<Integer>> resultats = new ArrayList<>();
            for (UUID id : List.of(premiere, seconde)) {
                resultats.add(executeur.submit(() -> {
                    depart.await();
                    return mockMvc.perform(authentifie(patch("/api/mentorat/mentorats/{id}/accepter", id), mentor)
                            .contentType("application/json").content("{}"))
                        .andReturn().getResponse().getStatus();
                }));
            }
            depart.countDown();
            List<Integer> statuts = new ArrayList<>();
            for (Future<Integer> resultat : resultats) statuts.add(resultat.get(30, TimeUnit.SECONDS));
            assertEquals(1, statuts.stream().filter(code -> code == 200).count(), statuts.toString());
            assertEquals(1, statuts.stream().filter(code -> code == 409).count(), statuts.toString());
        } finally {
            executeur.shutdownNow();
        }
        assertEquals(1, mentoratRepository.countByProfilMentor_IdAndStatut(profilId, StatutMentorat.ACCEPTEE));
    }

    @Test
    void t04_leMentorRefuseAvecOuSansMotif() throws Exception {
        envoyer(put("/api/mentorat/profil"), mentor, profil(true, 3, data)).andExpect(status().isOk());
        UUID avecMotif = demander(etudiant, profilId, data);
        UUID sansMotif = demander(autreEtudiant, profilId, data);

        envoyer(patch("/api/mentorat/mentorats/{id}/refuser", avecMotif), etudiant, "{}")
            .andExpect(status().isForbidden());
        envoyer(patch("/api/mentorat/mentorats/{id}/refuser", avecMotif), mentor,
                "{\"motif\":\"" + "a".repeat(501) + "\"}")
            .andExpect(status().isBadRequest());
        envoyer(patch("/api/mentorat/mentorats/{id}/refuser", avecMotif), mentor, "{\"motif\":\"  Agenda complet  \"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("REFUSEE"))
            .andExpect(jsonPath("$.motifRefus").value("Agenda complet"));
        envoyer(patch("/api/mentorat/mentorats/{id}/refuser", sansMotif), mentor, "{\"motif\":\"   \"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.motifRefus").doesNotExist());
    }

    @Test
    void t05_seulLEtudiantAnnuleEtSeulementUneDemandeEnAttente() throws Exception {
        UUID mentorat = demander(etudiant, profilId, data);
        envoyer(patch("/api/mentorat/mentorats/{id}/annuler", mentorat), mentor, "{}")
            .andExpect(status().isForbidden());
        envoyer(patch("/api/mentorat/mentorats/{id}/annuler", mentorat), etudiant, "{}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ANNULEE"))
            .andExpect(jsonPath("$.clotureLe").exists());

        UUID acceptee = demander(etudiant, profilId, data);
        changerStatut(acceptee, "accepter", mentor);
        envoyer(patch("/api/mentorat/mentorats/{id}/annuler", acceptee), etudiant, "{}")
            .andExpect(status().isConflict());
    }

    @Test
    void t06_lesDeuxParticipantsPeuventTerminerUnMentoratEnCoursSeulement() throws Exception {
        envoyer(put("/api/mentorat/profil"), mentor, profil(true, 2, data)).andExpect(status().isOk());
        UUID parLeMentor = demander(etudiant, profilId, data);
        UUID parLEtudiant = demander(autreEtudiant, profilId, data);

        envoyer(patch("/api/mentorat/mentorats/{id}/terminer", parLeMentor), mentor, "{}")
            .andExpect(status().isConflict());

        changerStatut(parLeMentor, "accepter", mentor);
        changerStatut(parLEtudiant, "accepter", mentor);
        envoyer(patch("/api/mentorat/mentorats/{id}/terminer", parLeMentor), mentor, "{}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("TERMINEE"))
            .andExpect(jsonPath("$.clotureLe").exists());
        envoyer(patch("/api/mentorat/mentorats/{id}/terminer", parLEtudiant), autreEtudiant, "{}")
            .andExpect(status().isOk());
        envoyer(patch("/api/mentorat/mentorats/{id}/terminer", parLEtudiant), intrus, "{}")
            .andExpect(status().isNotFound());
    }

    @Test
    void t07_unStatutFinalNeChangePlus() throws Exception {
        UUID mentorat = demander(etudiant, profilId, data);
        envoyer(patch("/api/mentorat/mentorats/{id}/refuser", mentorat), mentor, "{}").andExpect(status().isOk());
        for (String action : new String[] {"accepter", "refuser"}) {
            envoyer(patch("/api/mentorat/mentorats/{id}/" + action, mentorat), mentor, "{}")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ce mentorat n'est plus dans un état qui permet cette action."));
        }
        envoyer(patch("/api/mentorat/mentorats/{id}/annuler", mentorat), etudiant, "{}")
            .andExpect(status().isConflict());
    }

    @Test
    void t08_unMentoratInexistantOuUnIdentifiantInvalideSontRefuses() throws Exception {
        envoyer(patch("/api/mentorat/mentorats/{id}/accepter", UUID.randomUUID()), mentor, "{}")
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mentorat/mentorats/pas-un-uuid"), mentor))
            .andExpect(status().isBadRequest());
    }
}
