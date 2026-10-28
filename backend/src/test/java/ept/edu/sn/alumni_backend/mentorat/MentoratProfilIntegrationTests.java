package ept.edu.sn.alumni_backend.mentorat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.mentorat.entity.DomaineMentorat;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/** Cas P-* (référentiel, offre de mentorat) et R-* (recherche de mentors) du catalogue. */
@SpringBootTest
@AutoConfigureMockMvc
class MentoratProfilIntegrationTests extends MentoratTestsBase {
    private Utilisateur alumni;
    private Utilisateur etudiant;
    private UUID data;
    private UUID carriere;

    @BeforeEach
    void preparer() {
        alumni = creerUtilisateur(TypeRole.ALUMNI, "Diop");
        etudiant = creerUtilisateur(TypeRole.ETUDIANT, "Ndiaye");
        data = domaine("DATA_IA");
        carriere = domaine("CARRIERE_INSERTION");
    }

    // ---------- Référentiel ----------

    @Test
    void p01_lesDomainesActifsSontListesDansLOrdreEtUneSeuleFois() throws Exception {
        mockMvc.perform(authentifie(get("/api/mentorat/domaines"), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(10))
            .andExpect(jsonPath("$[0].code").value("DEV_LOGICIEL"))
            .andExpect(jsonPath("$[9].code").value("CONCOURS_ETUDES"));
        assertEquals(1, domaineRepository.findAll().stream().filter(d -> d.getCode().equals("DATA_IA")).count());
    }

    @Test
    void p02_unDomaineDesactiveDisparaitEtNePeutPlusEtreChoisi() throws Exception {
        DomaineMentorat inactif = new DomaineMentorat();
        inactif.setCode("TEST_INACTIF_" + UUID.randomUUID().toString().substring(0, 6));
        inactif.setLibelle("Domaine retiré");
        inactif.setActif(false);
        inactif.setOrdre((short) 99);
        domaineRepository.saveAndFlush(inactif);
        try {
            mockMvc.perform(authentifie(get("/api/mentorat/domaines"), etudiant))
                .andExpect(jsonPath("$.length()").value(10));
            envoyer(put("/api/mentorat/profil"), alumni, profil(true, 2, inactif.getId()))
                .andExpect(status().isBadRequest());
        } finally {
            domaineRepository.delete(inactif);
        }
    }

    @Test
    void p03_lesRoutesDuMentoratExigentUneConnexion() throws Exception {
        mockMvc.perform(get("/api/mentorat/domaines")).andExpect(status().isForbidden());
    }

    // ---------- Offre de mentorat ----------

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"ORGANISME", "ADMIN"})
    void p04_lesComptesDOrganismeOuDAdministrationNeProposentPasDeMentorat(TypeRole role) throws Exception {
        Utilisateur membre = creerUtilisateur(role, "Membre");
        envoyer(put("/api/mentorat/profil"), membre, profil(true, 2, data))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Le mentorat est réservé aux membres : étudiants, alumni, personnel et visiteurs."));
    }

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"ETUDIANT", "ALUMNI", "PERSONNEL", "VISITEUR"})
    void p10_toutMembreProposeDuMentoratEtApparaitDansLaRechercheAvecSonRole(TypeRole role) throws Exception {
        String nom = "Role" + UUID.randomUUID().toString().substring(0, 6);
        Utilisateur membre = renommer(creerUtilisateur(role, "x"), nom);
        envoyer(put("/api/mentorat/profil"), membre, profil(true, 2, data)).andExpect(status().isOk());

        Utilisateur demandeur = creerUtilisateur(TypeRole.VISITEUR, "Lycee");
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom), demandeur))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu.length()").value(1))
            .andExpect(jsonPath("$.contenu[0].role").value(role.name()));
        mockMvc.perform(authentifie(get("/api/annuaire").param("recherche", nom), demandeur))
            .andExpect(jsonPath("$.contenu[0].mentor").value("DISPONIBLE"));
    }

    @Test
    void p05_sansOffreLeProfilRepond404PuisLOffreEstCreeeAvecSesValeurs() throws Exception {
        mockMvc.perform(authentifie(get("/api/mentorat/profil"), alumni)).andExpect(status().isNotFound());

        envoyer(put("/api/mentorat/profil"), alumni, profil(true, 2, carriere, data))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.disponible").value(true))
            .andExpect(jsonPath("$.capaciteMax").value(2))
            .andExpect(jsonPath("$.mentoresActifs").value(0))
            .andExpect(jsonPath("$.domaines.length()").value(2))
            .andExpect(jsonPath("$.domaines[0].code").value("DATA_IA"));

        mockMvc.perform(authentifie(get("/api/mentorat/profil"), alumni))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.presentation").value("Data engineer."));
    }

    @Test
    void p06_modifierLOffreConserveLeMemeProfilEtRemplaceLesDomaines() throws Exception {
        UUID premier = creerProfil(alumni, true, 2, data);
        UUID second = creerProfil(alumni, false, 4, carriere);
        assertEquals(premier, second);
        mockMvc.perform(authentifie(get("/api/mentorat/profil"), alumni))
            .andExpect(jsonPath("$.disponible").value(false))
            .andExpect(jsonPath("$.capaciteMax").value(4))
            .andExpect(jsonPath("$.domaines.length()").value(1))
            .andExpect(jsonPath("$.domaines[0].code").value("CARRIERE_INSERTION"));
    }

    @Test
    void p07_unePresentationVideEstEnregistreeCommeAbsente() throws Exception {
        envoyer(put("/api/mentorat/profil"), alumni, """
            {"presentation":"   ","disponible":true,"capaciteMax":2,"domaineIds":["%s"]}
            """.formatted(data))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.presentation").doesNotExist());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{\"disponible\":true,\"capaciteMax\":2,\"domaineIds\":[]}",
        "{\"disponible\":true,\"capaciteMax\":0,\"domaineIds\":[\"%1$s\"]}",
        "{\"disponible\":true,\"capaciteMax\":11,\"domaineIds\":[\"%1$s\"]}",
        "{\"capaciteMax\":2,\"domaineIds\":[\"%1$s\"]}",
        "{\"disponible\":true,\"capaciteMax\":2}",
    })
    void p08_uneOffreInvalideEstRefusee(String corps) throws Exception {
        envoyer(put("/api/mentorat/profil"), alumni, corps.formatted(data)).andExpect(status().isBadRequest());
    }

    @Test
    void p09_plusDeCinqDomainesOuUnePresentationTropLongueSontRefuses() throws Exception {
        UUID[] six = domaineRepository.findByActifTrueOrderByOrdreAscLibelleAsc().stream()
            .limit(6).map(DomaineMentorat::getId).toArray(UUID[]::new);
        envoyer(put("/api/mentorat/profil"), alumni, profil(true, 2, six))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.domaineIds").value("Choisissez au plus 5 domaines"));

        envoyer(put("/api/mentorat/profil"), alumni, """
            {"presentation":"%s","disponible":true,"capaciteMax":2,"domaineIds":["%s"]}
            """.formatted("a".repeat(601), data))
            .andExpect(status().isBadRequest());
    }

    @Test
    void p10_unDomaineInconnuEstRefuse() throws Exception {
        envoyer(put("/api/mentorat/profil"), alumni, profil(true, 2, UUID.randomUUID()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Un des domaines choisis n'existe pas."));
    }

    @Test
    void p11_laCapaciteNePeutPasDescendreSousLeNombreDeMentoresActifs() throws Exception {
        UUID profilId = creerProfil(alumni, true, 3, data);
        changerStatut(demander(etudiant, profilId, data), "accepter", alumni);
        Utilisateur autre = creerUtilisateur(TypeRole.ETUDIANT, "Fall");
        changerStatut(demander(autre, profilId, data), "accepter", alumni);

        envoyer(put("/api/mentorat/profil"), alumni, profil(true, 1, data))
            .andExpect(status().isConflict());
        envoyer(put("/api/mentorat/profil"), alumni, profil(true, 2, data))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.mentoresActifs").value(2));
    }

    // ---------- Recherche ----------

    @Test
    void r01_laRechercheTrouveParNomPrenomOuPosteSansTenirCompteDeLaCasse() throws Exception {
        alumni.setPosteActuel("Ingénieure Cloud chez Sonatel");
        utilisateurRepository.saveAndFlush(alumni);
        creerProfil(alumni, true, 2, data);

        for (String recherche : new String[] {alumni.getNom().toUpperCase(), "sonatel"}) {
            mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", recherche), etudiant))
                .andExpect(jsonPath("$.contenu[?(@.utilisateurId == '%s')]".formatted(alumni.getId())).exists());
        }
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", "introuvable-xyz"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void r02_leFiltreParDomaineEtLeFiltreDisponiblesSAppliquent() throws Exception {
        creerProfil(alumni, false, 2, data);
        String nom = alumni.getNom();

        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom)
                .param("domaine", data.toString()), etudiant))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].disponible").value(false));
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom)
                .param("domaine", carriere.toString()), etudiant))
            .andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom)
                .param("disponibles", "true"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void r03_lesMentorsDisponiblesPassentAvantLesIndisponibles() throws Exception {
        Utilisateur indisponible = creerUtilisateur(TypeRole.ALUMNI, "Aaa");
        Utilisateur disponible = creerUtilisateur(TypeRole.ALUMNI, "Zzz");
        String prefixe = "Tri" + UUID.randomUUID().toString().substring(0, 6);
        indisponible.setNom(prefixe + "A");
        disponible.setNom(prefixe + "Z");
        utilisateurRepository.saveAllAndFlush(java.util.List.of(indisponible, disponible));
        creerProfil(indisponible, false, 2, data);
        creerProfil(disponible, true, 2, data);

        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", prefixe), etudiant))
            .andExpect(jsonPath("$.contenu[0].nom").value(prefixe + "Z"))
            .andExpect(jsonPath("$.contenu[1].nom").value(prefixe + "A"));
    }

    @Test
    void r04_unCompteNonActifOuNonVerifieNApparaitPasEtOnNeSeVoitPasSoiMeme() throws Exception {
        // L'offre est créée quand le compte est actif, puis le compte change d'état.
        Utilisateur enAttente = creerUtilisateur(TypeRole.ALUMNI, "Attente");
        Utilisateur suspendu = creerUtilisateur(TypeRole.ALUMNI, "Suspendu");
        Utilisateur nonVerifie = creerUtilisateur(TypeRole.ALUMNI, "NonVerifie");
        for (Utilisateur membre : new Utilisateur[] {enAttente, suspendu, nonVerifie, alumni}) {
            creerProfil(membre, true, 2, data);
        }
        enAttente.setStatutCompte(StatutCompte.EN_ATTENTE);
        suspendu.setStatutCompte(StatutCompte.SUSPENDU);
        nonVerifie.setEmailVerifie(false);
        utilisateurRepository.saveAllAndFlush(java.util.List.of(enAttente, suspendu, nonVerifie));

        for (Utilisateur membre : new Utilisateur[] {enAttente, suspendu, nonVerifie}) {
            mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", membre.getNom()), etudiant))
                .andExpect(jsonPath("$.totalElements").value(0));
        }
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", alumni.getNom()), alumni))
            .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void r05_lesPlacesRestantesEtLaDemandeEnCoursSuiventLesMentorats() throws Exception {
        UUID profilId = creerProfil(alumni, true, 2, data);
        String nom = alumni.getNom();
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom), etudiant))
            .andExpect(jsonPath("$.contenu[0].placesRestantes").value(2))
            .andExpect(jsonPath("$.contenu[0].demandeEnCours").value(false));

        UUID mentorat = demander(etudiant, profilId, data);
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom), etudiant))
            .andExpect(jsonPath("$.contenu[0].demandeEnCours").value(true))
            .andExpect(jsonPath("$.contenu[0].placesRestantes").value(2));

        changerStatut(mentorat, "accepter", alumni);
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom), etudiant))
            .andExpect(jsonPath("$.contenu[0].demandeEnCours").value(true))
            .andExpect(jsonPath("$.contenu[0].placesRestantes").value(1));

        changerStatut(mentorat, "terminer", alumni);
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", nom), etudiant))
            .andExpect(jsonPath("$.contenu[0].demandeEnCours").value(false))
            .andExpect(jsonPath("$.contenu[0].placesRestantes").value(2));
    }

    @Test
    void r06_laPaginationEstBorneeEtRespectee() throws Exception {
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("taille", "0"), etudiant))
            .andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("taille", "49"), etudiant))
            .andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("page", "-1"), etudiant))
            .andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", "a".repeat(101)), etudiant))
            .andExpect(status().isBadRequest());

        String prefixe = "Page" + UUID.randomUUID().toString().substring(0, 6);
        for (int i = 0; i < 3; i++) {
            Utilisateur mentor = creerUtilisateur(TypeRole.ALUMNI, "x");
            mentor.setNom(prefixe + i);
            utilisateurRepository.saveAndFlush(mentor);
            creerProfil(mentor, true, 2, data);
        }
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", prefixe)
                .param("taille", "2").param("page", "1"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(3))
            .andExpect(jsonPath("$.totalPages").value(2))
            .andExpect(jsonPath("$.contenu.length()").value(1))
            .andExpect(jsonPath("$.contenu[0].nom").value(prefixe + "2"));
    }

    // ---------- Mentorat hors du module (annuaire, profil) ----------

    @Test
    void a01_lAnnuaireSignaleLesMentorsDisponiblesOuIndisponibles() throws Exception {
        String prefixe = "Annu" + UUID.randomUUID().toString().substring(0, 6);
        Utilisateur disponible = renommer(alumni, prefixe + "A");
        Utilisateur complet = renommer(creerUtilisateur(TypeRole.ALUMNI, "x"), prefixe + "B");
        Utilisateur enPause = renommer(creerUtilisateur(TypeRole.ALUMNI, "x"), prefixe + "C");
        renommer(creerUtilisateur(TypeRole.ALUMNI, "x"), prefixe + "D");
        creerProfil(disponible, true, 2, data);
        UUID profilComplet = creerProfil(complet, true, 1, data);
        changerStatut(demander(etudiant, profilComplet, data), "accepter", complet);
        creerProfil(enPause, false, 2, data);

        mockMvc.perform(authentifie(get("/api/annuaire").param("recherche", prefixe).param("role", "ALUMNI"), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[0].mentor").value("DISPONIBLE"))
            .andExpect(jsonPath("$.contenu[1].mentor").value("INDISPONIBLE"))
            .andExpect(jsonPath("$.contenu[2].mentor").value("INDISPONIBLE"))
            .andExpect(jsonPath("$.contenu[3].mentor").doesNotExist());
    }

    @Test
    void a02_leProfilDUnMentorDonneSonOffreEtLaDemandeEnCoursDuVisiteur() throws Exception {
        UUID profilId = creerProfil(alumni, true, 2, data);
        mockMvc.perform(authentifie(get("/api/mentorat/mentors/utilisateur/{id}", alumni.getId()), etudiant))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.profilId").value(profilId.toString()))
            .andExpect(jsonPath("$.placesRestantes").value(2))
            .andExpect(jsonPath("$.demandeEnCours").value(false))
            .andExpect(jsonPath("$.domaines[0].code").value("DATA_IA"));

        demander(etudiant, profilId, data);
        mockMvc.perform(authentifie(get("/api/mentorat/mentors/utilisateur/{id}", alumni.getId()), etudiant))
            .andExpect(jsonPath("$.demandeEnCours").value(true));
    }

    @Test
    void a03_unMembreSansOffreOuUnMentorSuspenduNAPasDOffreVisible() throws Exception {
        mockMvc.perform(authentifie(get("/api/mentorat/mentors/utilisateur/{id}", alumni.getId()), etudiant))
            .andExpect(status().isNotFound());

        creerProfil(alumni, true, 2, data);
        alumni.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurRepository.saveAndFlush(alumni);
        mockMvc.perform(authentifie(get("/api/mentorat/mentors/utilisateur/{id}", alumni.getId()), etudiant))
            .andExpect(status().isNotFound());
    }

    private Utilisateur renommer(Utilisateur utilisateur, String nom) {
        utilisateur.setNom(nom);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    @Test
    void r07_laCarteNExposeAucuneCoordonneePrivee() throws Exception {
        creerProfil(alumni, true, 2, data);
        mockMvc.perform(authentifie(get("/api/mentorat/mentors").param("recherche", alumni.getNom()), etudiant))
            .andExpect(jsonPath("$.contenu[0].email").doesNotExist())
            .andExpect(jsonPath("$.contenu[0].telephone").doesNotExist())
            .andExpect(jsonPath("$.contenu[0].dateNaissance").doesNotExist());
    }
}
