package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.ChefDepartementRepository;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.filiere.service.MigrationFilieres;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Filières gérées par l'administration et chefs de département (TRA-14). */
@SpringBootTest
@AutoConfigureMockMvc
class FilieresIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private ChefDepartementRepository chefDepartementRepository;
    @Autowired private ActionAdminRepository actionAdminRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private MigrationFilieres migration;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TransactionTemplate transaction;

    private final String lot = UUID.randomUUID().toString().substring(0, 8);
    private Utilisateur superAdmin;
    private Utilisateur gestionnaire;

    @BeforeEach
    void preparer() {
        superAdmin = creerAdmin("Super", PermissionAdmin.GERER_ADMINISTRATEURS);
        gestionnaire = creerAdmin("Comptes", PermissionAdmin.GERER_COMPTES);
    }

    @AfterEach
    void nettoyer() {
        chefDepartementRepository.deleteAll();
        filiereRepository.saveAll(filiereRepository.findAll().stream().peek(filiere -> filiere.setCreeePar(null)).toList());
        actionAdminRepository.deleteAll();
        refreshTokenRepository.deleteAll();
    }

    @Test
    void f01_lesFilieresProposeesSeLisentSansCompteEtCellesRetireesNApparaissentPas() throws Exception {
        Filiere retiree = filiereRepository.saveAndFlush(new Filiere("Retirée " + lot, null));
        retiree.setActive(false);
        filiereRepository.saveAndFlush(retiree);

        mockMvc.perform(get("/api/public/filieres"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].nom", hasItems("Génie Civil", "Génie Informatique et Télécommunications",
                "Génie Électromécanique", "Génie Industriel", "Génie Aéronautique et Aérospatial")))
            .andExpect(jsonPath("$[*].nom", not(hasItem("Retirée " + lot))));
        // Ordre alphabétique français : l'accent ne renvoie pas « Électromécanique » en fin de liste.
        String liste = mockMvc.perform(get("/api/public/filieres")).andReturn().getResponse().getContentAsString();
        assertThat(liste.indexOf("Génie Électromécanique")).isLessThan(liste.indexOf("Génie Industriel"));
    }

    @Test
    void f02_unAdministrateurComptesAjouteUneFiliereSansDoublonDeCasseNiDAccents() throws Exception {
        envoyer(post("/api/admin/filieres"), gestionnaire, "{\"nom\":\"  Génie   Chimique " + lot + " \"}")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.nom").value("Génie Chimique " + lot))
            .andExpect(jsonPath("$.active").value(true))
            .andExpect(jsonPath("$.nombreComptes").value(0));

        envoyer(post("/api/admin/filieres"), gestionnaire, "{\"nom\":\"genie chimique " + lot.toUpperCase() + "\"}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("La filière « Génie Chimique " + lot + " » existe déjà."));

        Utilisateur stages = creerAdmin("Stages", PermissionAdmin.GERER_STAGES);
        envoyer(post("/api/admin/filieres"), stages, "{\"nom\":\"Autre " + lot + "\"}").andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/filieres"), stages)).andExpect(status().isForbidden());
    }

    @Test
    void f03_autreALaCreationDUnCompteCreeLaFiliereOuReprendLExistante() throws Exception {
        creerCompte("nouvelle", "Génie Pétrolier " + lot).andExpect(status().isCreated());
        Filiere creee = filiereRepository.findByCle(Filiere.cle("Génie Pétrolier " + lot)).orElseThrow();
        UUID auteur = transaction.execute(statut -> filiereRepository.findById(creee.getId()).orElseThrow().getCreeePar().getId());
        assertThat(auteur).isEqualTo(gestionnaire.getId());

        creerCompte("existante", "GENIE CIVIL").andExpect(status().isCreated());
        assertThat(nomFiliereDe("existante")).isEqualTo("Génie Civil");
        assertThat(filiereRepository.findAll()).filteredOn(f -> f.getCle().equals("genie civil")).hasSize(1);
    }

    @Test
    void f04_lImportRefuseUneFiliereInconnueSansLaCreer() throws Exception {
        envoyer(post("/api/admin/comptes/import"), gestionnaire, """
            {"role":"ETUDIANT","lignes":[
              {"prenom":"Awa","nom":"Diop","email":"import.%1$s.1@example.invalid","filiere":"génie civil","anneeEntree":2026},
              {"prenom":"Binta","nom":"Sow","email":"import.%1$s.2@example.invalid","filiere":"Genie Cvil","anneeEntree":2026}
            ]}
            """.formatted(lot))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.crees").value(1))
            .andExpect(jsonPath("$.lignes[1].message").value(
                "La filière « Genie Cvil » n'existe pas. Ajoutez-la depuis l'écran Filières, ou corrigez le nom."));
        assertThat(filiereRepository.findByCle("genie cvil")).isEmpty();
    }

    @Test
    void f05_renommerUneFiliereChangeLeNomAfficheSurLesComptes() throws Exception {
        Filiere filiere = filiereRepository.saveAndFlush(new Filiere("Ancien nom " + lot, null));
        Utilisateur etudiant = creerMembre(TypeRole.ETUDIANT, filiere);

        envoyer(patch("/api/admin/filieres/{id}/nom", filiere.getId()), gestionnaire, "{\"nom\":\"Génie Civil\"}")
            .andExpect(status().isConflict());
        envoyer(patch("/api/admin/filieres/{id}/nom", filiere.getId()), gestionnaire, "{\"nom\":\"Nouveau nom " + lot + "\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nombreComptes").value(1));

        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}", etudiant.getId()), gestionnaire))
            .andExpect(jsonPath("$.compte.filiere").value("Nouveau nom " + lot));
    }

    @Test
    void f06_uneFiliereRetireeNEstPlusAccepteeALaCreationPuisRevientUneFoisProposee() throws Exception {
        Filiere filiere = filiereRepository.saveAndFlush(new Filiere("À retirer " + lot, null));

        envoyer(patch("/api/admin/filieres/{id}/retirer", filiere.getId()), gestionnaire, "").andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(false));
        envoyer(patch("/api/admin/filieres/{id}/retirer", filiere.getId()), gestionnaire, "").andExpect(status().isConflict());
        creerCompte("retiree", "À retirer " + lot)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(
                "La filière « À retirer " + lot + " » est retirée. Proposez-la de nouveau depuis l'écran Filières pour l'utiliser."));

        envoyer(patch("/api/admin/filieres/{id}/proposer", filiere.getId()), gestionnaire, "").andExpect(status().isOk());
        creerCompte("proposee", "À retirer " + lot).andExpect(status().isCreated());
    }

    @Test
    void f07_fusionnerDeplaceLesComptesEtLeChefPuisSupprimeLaFiliere() throws Exception {
        Filiere doublon = filiereRepository.saveAndFlush(new Filiere("Informatique " + lot, null));
        Filiere cible = filiereRepository.saveAndFlush(new Filiere("Génie Informatique " + lot, null));
        Utilisateur etudiant = creerMembre(TypeRole.ETUDIANT, doublon);
        Utilisateur chef = creerMembre(TypeRole.PERSONNEL, null);
        envoyer(put("/api/admin/filieres/{id}/chef", doublon.getId()), superAdmin, "{\"chefId\":\"" + chef.getId() + "\"}")
            .andExpect(status().isOk());

        envoyer(post("/api/admin/filieres/{id}/fusion", doublon.getId()), gestionnaire, "{\"cibleId\":\"" + doublon.getId() + "\"}")
            .andExpect(status().isBadRequest());
        envoyer(post("/api/admin/filieres/{id}/fusion", doublon.getId()), gestionnaire, "{\"cibleId\":\"" + cible.getId() + "\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(cible.getId().toString()))
            .andExpect(jsonPath("$.nombreComptes").value(1))
            .andExpect(jsonPath("$.chef.id").value(chef.getId().toString()));

        assertThat(filiereRepository.findById(doublon.getId())).isEmpty();
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}", etudiant.getId()), gestionnaire))
            .andExpect(jsonPath("$.compte.filiere").value("Génie Informatique " + lot));
    }

    @Test
    void f08_seulUnSuperAdministrateurDesigneUnChefParmiLePersonnelActif() throws Exception {
        Filiere filiere = filiereRepository.saveAndFlush(new Filiere("Département " + lot, null));
        Utilisateur premier = creerMembre(TypeRole.PERSONNEL, null);
        Utilisateur second = creerMembre(TypeRole.PERSONNEL, null);
        Utilisateur alumni = creerMembre(TypeRole.ALUMNI, null);
        String route = "/api/admin/filieres/{id}/chef";

        envoyer(put(route, filiere.getId()), gestionnaire, "{\"chefId\":\"" + premier.getId() + "\"}")
            .andExpect(status().isForbidden());
        envoyer(put(route, filiere.getId()), superAdmin, "{\"chefId\":\"" + alumni.getId() + "\"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le chef de département doit être un compte actif du personnel de l'école."));
        mockMvc.perform(authentifie(get("/api/admin/filieres/chefs-possibles"), superAdmin))
            .andExpect(jsonPath("$[*].id", hasItems(premier.getId().toString(), second.getId().toString())))
            .andExpect(jsonPath("$[*].id", not(hasItem(alumni.getId().toString()))));

        envoyer(put(route, filiere.getId()), superAdmin, "{\"chefId\":\"" + premier.getId() + "\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chef.prenom").value("Membre"));
        envoyer(put(route, filiere.getId()), superAdmin, "{\"chefId\":\"" + premier.getId() + "\"}")
            .andExpect(status().isConflict());
        envoyer(put(route, filiere.getId()), superAdmin, "{\"chefId\":\"" + second.getId() + "\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chef.id").value(second.getId().toString()));

        assertThat(typesJournal(premier)).containsExactly(TypeActionAdmin.RETRAIT_CHEF_DEPARTEMENT, TypeActionAdmin.DESIGNATION_CHEF_DEPARTEMENT);
        assertThat(actionAdminRepository.findByCible_IdOrderByDateActionDesc(second.getId()))
            .singleElement().extracting(ActionAdmin::getDetails).isEqualTo("Département " + lot);

        mockMvc.perform(authentifie(delete(route, filiere.getId()), superAdmin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.chef").doesNotExist());
        mockMvc.perform(authentifie(delete(route, filiere.getId()), superAdmin)).andExpect(status().isConflict());
    }

    @Test
    void f09_laMigrationRattacheLesAnciensTextesPuisSupprimeLaColonne() {
        Utilisateur connu = creerMembre(TypeRole.ALUMNI, null);
        Utilisateur inconnu = creerMembre(TypeRole.ALUMNI, null);
        jdbcTemplate.execute("alter table utilisateur add column filiere varchar(255)");
        jdbcTemplate.update("update utilisateur set filiere = ? where id = ?", " génie  CIVIL ", connu.getId());
        jdbcTemplate.update("update utilisateur set filiere = ? where id = ?", "Pétrole et gaz " + lot, inconnu.getId());

        migration.run(null);
        migration.run(null);

        assertThat(nomFiliereDe(connu)).isEqualTo("Génie Civil");
        assertThat(nomFiliereDe(inconnu)).isEqualTo("Pétrole et gaz " + lot);
        assertThat(filiereRepository.findAll()).filteredOn(f -> f.getCle().equals("genie civil")).hasSize(1);
        Integer colonnes = jdbcTemplate.queryForObject("""
            select count(*) from information_schema.columns
            where lower(table_name) = 'utilisateur' and lower(column_name) = 'filiere'
            """, Integer.class);
        assertThat(colonnes).isZero();
    }

    private ResultActions creerCompte(String suffixe, String filiere) throws Exception {
        return envoyer(post("/api/admin/comptes"), gestionnaire, """
            {"prenom":"Awa","nom":"Diop","email":"%s.%s@example.invalid","role":"ETUDIANT","filiere":"%s"}
            """.formatted(suffixe, lot, filiere));
    }

    private String nomFiliereDe(String suffixe) {
        return nomFiliereDe(utilisateurRepository.findByEmail(suffixe + "." + lot + "@example.invalid").orElseThrow());
    }

    private String nomFiliereDe(Utilisateur compte) {
        return transaction.execute(statut -> utilisateurRepository.findById(compte.getId()).orElseThrow().getNomFiliere());
    }

    private List<TypeActionAdmin> typesJournal(Utilisateur compte) {
        return actionAdminRepository.findByCible_IdOrderByDateActionDesc(compte.getId()).stream().map(ActionAdmin::getType).toList();
    }

    private Utilisateur creerAdmin(String prenom, PermissionAdmin... permissions) {
        Utilisateur admin = nouveauCompte(TypeRole.ADMIN, prenom);
        admin.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(admin);
    }

    private Utilisateur creerMembre(TypeRole role, Filiere filiere) {
        Utilisateur compte = nouveauCompte(role, "Membre");
        compte.setFiliere(filiere);
        return utilisateurRepository.saveAndFlush(compte);
    }

    private static Utilisateur nouveauCompte(TypeRole role, String prenom) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("filieres." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom(prenom);
        compte.setNom("Test");
        compte.setRole(role);
        compte.setStatutCompte(StatutCompte.ACTIF);
        compte.setEmailVerifie(true);
        return compte;
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
