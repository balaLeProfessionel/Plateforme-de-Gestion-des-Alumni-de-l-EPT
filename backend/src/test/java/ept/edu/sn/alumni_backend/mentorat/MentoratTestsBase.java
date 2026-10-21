package ept.edu.sn.alumni_backend.mentorat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.mentorat.repository.DomaineMentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.EvaluationMentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.MentoratRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.ProfilMentorRepository;
import ept.edu.sn.alumni_backend.mentorat.repository.SeanceMentoratRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Outils communs aux tests d'intégration du mentorat : comptes, offres, demandes. */
abstract class MentoratTestsBase {
    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JwtService jwtService;

    @Autowired
    protected UtilisateurRepository utilisateurRepository;

    @Autowired
    protected DomaineMentoratRepository domaineRepository;

    @Autowired
    protected EvaluationMentoratRepository evaluationRepository;

    @Autowired
    protected SeanceMentoratRepository seanceRepository;

    @Autowired
    protected MentoratRepository mentoratRepository;

    @Autowired
    protected ProfilMentorRepository profilMentorRepository;

    /** Les autres classes de test vident les utilisateurs : on retire ce qui les référence. */
    @AfterEach
    void nettoyerMentorat() {
        evaluationRepository.deleteAll();
        seanceRepository.deleteAll();
        mentoratRepository.deleteAll();
        profilMentorRepository.deleteAll();
    }

    protected Utilisateur creerUtilisateur(TypeRole role, String nom) {
        return creerUtilisateur(role, nom, StatutCompte.ACTIF, true);
    }

    protected Utilisateur creerUtilisateur(TypeRole role, String nom, StatutCompte statut, boolean emailVerifie) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("mentorat." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom("Membre");
        utilisateur.setNom(nom + "-" + UUID.randomUUID().toString().substring(0, 8));
        utilisateur.setTelephone("+221700000000");
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(emailVerifie);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    protected MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }

    protected ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur utilisateur, String corps)
            throws Exception {
        return mockMvc.perform(authentifie(requete, utilisateur).contentType(MediaType.APPLICATION_JSON).content(corps));
    }

    protected UUID domaine(String code) {
        return domaineRepository.findByActifTrueOrderByOrdreAscLibelleAsc().stream()
            .filter(domaine -> domaine.getCode().equals(code))
            .findFirst()
            .orElseThrow()
            .getId();
    }

    protected static String profil(boolean disponible, int capacite, UUID... domaineIds) {
        String ids = Arrays.stream(domaineIds).map(id -> "\"" + id + "\"").collect(Collectors.joining(","));
        return """
            {"presentation":"Data engineer.","disponible":%s,"capaciteMax":%d,"domaineIds":[%s]}
            """.formatted(disponible, capacite, ids);
    }

    protected static String demande(UUID profilId, UUID domaineId) {
        return """
            {"profilMentorId":"%s","domaineId":"%s","objectif":"Préparer mon stage"}
            """.formatted(profilId, domaineId);
    }

    protected static String seance(int duree) {
        return """
            {"debut":"%s","dureeMinutes":%d,"modalite":"VISIO","lieuOuLien":"https://meet.example.invalid/a"}
            """.formatted(Instant.now().plusSeconds(86_400), duree);
    }

    protected UUID creerProfil(Utilisateur mentor, boolean disponible, int capacite, UUID... domaineIds) throws Exception {
        String reponse = envoyer(put("/api/mentorat/profil"), mentor, profil(disponible, capacite, domaineIds))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(reponse, "$.id"));
    }

    protected UUID demander(Utilisateur mentore, UUID profilId, UUID domaineId) throws Exception {
        String reponse = envoyer(post("/api/mentorat/mentorats"), mentore, demande(profilId, domaineId))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(reponse, "$.id"));
    }

    protected void changerStatut(UUID mentoratId, String action, Utilisateur auteur) throws Exception {
        envoyer(patch("/api/mentorat/mentorats/{id}/" + action, mentoratId), auteur, "{}")
            .andExpect(status().isOk());
    }

    protected UUID planifier(UUID mentoratId, Utilisateur auteur) throws Exception {
        String reponse = envoyer(post("/api/mentorat/mentorats/{id}/seances", mentoratId), auteur, seance(45))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(reponse, "$.id"));
    }
}
