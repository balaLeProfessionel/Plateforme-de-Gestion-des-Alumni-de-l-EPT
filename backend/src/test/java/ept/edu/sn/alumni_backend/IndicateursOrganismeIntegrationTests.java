package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutOffre;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.entity.Candidature;
import ept.edu.sn.alumni_backend.stage.entity.OffreStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.repository.CandidatureRepository;
import ept.edu.sn.alumni_backend.stage.repository.OffreStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Indicateurs de l'organisme avec l'école (STA-13) : calculs par année, type et filière, accès réservé. */
@SpringBootTest
@AutoConfigureMockMvc
class IndicateursOrganismeIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private OffreStageRepository offreRepository;
    @Autowired private CandidatureRepository candidatureRepository;
    @Autowired private StageRepository stageRepository;
    @Autowired private FiliereRepository filiereRepository;

    private Organisme organisme;
    private Utilisateur compteOrganisme;
    private Filiere filiere;

    @BeforeEach
    void preparer() {
        organisme = new Organisme();
        organisme.setNom("Indicateurs " + UUID.randomUUID().toString().substring(0, 8));
        organisme.setStatutValidation(StatutCompte.ACTIF);
        organisme = organismeRepository.saveAndFlush(organisme);
        compteOrganisme = compte(TypeRole.ORGANISME);
        compteOrganisme.setOrganisme(organisme);
        utilisateurRepository.saveAndFlush(compteOrganisme);
        filiere = FilieresDeTest.filiere(filiereRepository, "Indicateurs " + UUID.randomUUID().toString().substring(0, 6));
    }

    @AfterEach
    void nettoyer() {
        stageRepository.deleteAll();
        candidatureRepository.deleteAll();
        offreRepository.deleteAll();
        compteOrganisme.setOrganisme(null);
        utilisateurRepository.save(compteOrganisme);
        organismeRepository.delete(organisme);
    }

    @Test
    void i01_lOrganismeVoitSesOffresCandidaturesEtStagiaires() throws Exception {
        OffreStage offre2025 = offre(StatutOffre.LISTE_PUBLIEE, Instant.parse("2025-03-10T10:00:00Z"), TypeStage.PFE);
        OffreStage offre2026 = offre(StatutOffre.PUBLIEE, Instant.parse("2026-03-10T10:00:00Z"), TypeStage.MAITRISE);
        offre(StatutOffre.SOUMISE, null, TypeStage.PFE);
        candidature(offre2025, true);
        candidature(offre2025, true);
        candidature(offre2026, true);
        candidature(offre2026, false);
        stage(offre2025, TypeStage.PFE, filiere, StatutStage.CONFIRME);
        stage(offre2025, TypeStage.PFE, null, StatutStage.CONFIRME);
        stage(offre2026, TypeStage.MAITRISE, filiere, StatutStage.ANNULE);

        mockMvc.perform(authentifie(get("/api/stages/mes-indicateurs"), compteOrganisme))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.offresPubliees").value(2))
            .andExpect(jsonPath("$.candidaturesRecues").value(3))
            .andExpect(jsonPath("$.etudiantsAccueillis").value(2))
            .andExpect(jsonPath("$.parAnnee[0].annee").value(2026))
            .andExpect(jsonPath("$.parAnnee[0].candidatures").value(1))
            .andExpect(jsonPath("$.parAnnee[1].annee").value(2025))
            .andExpect(jsonPath("$.parAnnee[1].candidatures").value(2))
            .andExpect(jsonPath("$.accueillisParType[0].cle").value("PFE"))
            .andExpect(jsonPath("$.accueillisParType[0].nombre").value(2))
            .andExpect(jsonPath("$.accueillisParFiliere.length()").value(2));
    }

    @Test
    void i02_lesIndicateursSontReservesAuxOrganismes() throws Exception {
        mockMvc.perform(authentifie(get("/api/stages/mes-indicateurs"), compte(TypeRole.ETUDIANT))).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/stages/mes-indicateurs"), compteOrganisme))
            .andExpect(status().isOk()).andExpect(jsonPath("$.offresPubliees").value(0)).andExpect(jsonPath("$.parAnnee.length()").value(0));
    }

    private OffreStage offre(StatutOffre statut, Instant publieeLe, TypeStage type) {
        OffreStage o = new OffreStage();
        o.setOrganisme(organisme);
        o.setTitre("Offre");
        o.setDescription("Missions");
        o.setCompetences("Rigueur");
        o.setDureeMois(4);
        o.setTypeStage(type);
        o.setDateLimiteCandidature(LocalDate.of(2030, 1, 1));
        o.setStatut(statut);
        o.setPublieeLe(publieeLe);
        o.setCreeePar(compteOrganisme);
        return offreRepository.saveAndFlush(o);
    }

    private void candidature(OffreStage offre, boolean envoyee) {
        Candidature c = new Candidature(offre, compte(TypeRole.ETUDIANT));
        c.setCv(UUID.randomUUID() + ".pdf");
        c.setNomCv("cv.pdf");
        c.envoyer(null);
        if (!envoyee) c.retirer();
        candidatureRepository.saveAndFlush(c);
    }

    private void stage(OffreStage offre, TypeStage type, Filiere filiereEtudiant, StatutStage statut) {
        Utilisateur etudiant = compte(TypeRole.ETUDIANT);
        etudiant.setFiliere(filiereEtudiant);
        utilisateurRepository.saveAndFlush(etudiant);
        Stage s = new Stage();
        s.setEtudiant(etudiant);
        s.setOrganisme(organisme);
        s.setOffre(offre);
        s.setTypeStage(type);
        s.setSujet("Sujet");
        s.setDateDebut(LocalDate.of(2026, 4, 1));
        s.setDateFin(LocalDate.of(2026, 8, 31));
        s.setStatut(statut);
        s.setCreePar(compteOrganisme);
        stageRepository.saveAndFlush(s);
    }

    private Utilisateur compte(TypeRole role) {
        Utilisateur u = new Utilisateur();
        u.setEmail("indicateurs." + UUID.randomUUID() + "@example.invalid");
        u.setPassword("hash-de-test");
        u.setPrenom("Test");
        u.setNom(role.name());
        u.setRole(role);
        u.setStatutCompte(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        return utilisateurRepository.saveAndFlush(u);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }
}
