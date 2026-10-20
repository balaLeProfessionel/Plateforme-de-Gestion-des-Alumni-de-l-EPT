package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import ept.edu.sn.alumni_backend.evenement.AudienceEvenement;
import ept.edu.sn.alumni_backend.evenement.PeriodeEvenement;
import ept.edu.sn.alumni_backend.evenement.ReponseParticipation;
import ept.edu.sn.alumni_backend.evenement.StatutEvenement;
import ept.edu.sn.alumni_backend.evenement.entity.Evenement;
import ept.edu.sn.alumni_backend.evenement.entity.ParticipationEvenement;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.evenement.repository.ParticipationEvenementRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class EvenementConsultationIntegrationTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private EvenementRepository evenementRepository;

    @Autowired
    private ParticipationEvenementRepository participationRepository;

    private Utilisateur alumni;
    private Utilisateur etudiant;
    private Utilisateur personnel;

    @BeforeEach
    void preparerComptes() {
        alumni = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, true);
        etudiant = creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.ACTIF, true);
        personnel = creerUtilisateur(TypeRole.PERSONNEL, StatutCompte.ACTIF, true);
    }

    @Test
    void listeLesEvenementsCiblesEtAppliqueLaPagination() throws Exception {
        creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, Instant.now().plusSeconds(7200));
        creerEvenement(AudienceEvenement.ETUDIANTS, StatutEvenement.PUBLIE, Instant.now().plusSeconds(10800));
        creerEvenement(AudienceEvenement.TOUS, StatutEvenement.PUBLIE, Instant.now().plusSeconds(14400));
        creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.ANNULE, Instant.now().plusSeconds(18000));

        mockMvc.perform(requeteAuthentifie("/api/evenements", alumni)
                .param("taille", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu.length()").value(1))
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.totalPages").value(2))
            .andExpect(jsonPath("$.contenu[0].audience").value("ALUMNI"));

        mockMvc.perform(requeteAuthentifie("/api/evenements", personnel))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].audience").value("TOUS"));
    }

    @Test
    void filtreLesEvenementsPassesEtTrieDuPlusRecentAuPlusAncien() throws Exception {
        Instant maintenant = Instant.now();
        creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, maintenant.minusSeconds(86400));
        creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, maintenant.minusSeconds(172800));
        creerEvenement(AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, maintenant.plusSeconds(3600));

        mockMvc.perform(requeteAuthentifie("/api/evenements", alumni).param("periode", "PASSES"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.contenu[0].dateDebut")
                .value(evenementRepository.findAll().stream()
                    .filter(evenement -> evenement.getDateFin().isBefore(Instant.now()))
                    .map(Evenement::getDateDebut)
                    .max(Instant::compareTo)
                    .orElseThrow().toString()));
    }

    @Test
    void refuseLeDetailDUnEvenementHorsAudienceSansRevelerSonExistence() throws Exception {
        Utilisateur organisateur = creerUtilisateur(TypeRole.PERSONNEL, StatutCompte.ACTIF, true);
        Evenement evenement = creerEvenement(
            organisateur, AudienceEvenement.ETUDIANTS, StatutEvenement.PUBLIE, Instant.now().plusSeconds(7200));

        mockMvc.perform(requeteAuthentifie("/api/evenements/{id}", alumni, evenement.getId()))
            .andExpect(status().isNotFound());

        mockMvc.perform(requeteAuthentifie("/api/evenements/{id}", etudiant, evenement.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(evenement.getId().toString()))
            .andExpect(jsonPath("$.organisateurId").value(organisateur.getId().toString()))
            .andExpect(jsonPath("$.nombreParticipants").value(0))
            .andExpect(jsonPath("$.email").doesNotExist())
            .andExpect(jsonPath("$.telephone").doesNotExist());
    }

    @Test
    void inclutLeNombreDeReponsesPositivesSansCompterLesRefus() throws Exception {
        Evenement evenement = creerEvenement(
            AudienceEvenement.ALUMNI, StatutEvenement.PUBLIE, Instant.now().plusSeconds(7200));
        Utilisateur participantOui = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, true);
        Utilisateur participantNon = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, true);
        creerParticipation(evenement, participantOui, ReponseParticipation.PARTICIPERA);
        creerParticipation(evenement, participantNon, ReponseParticipation.NE_PARTICIPERA_PAS);

        mockMvc.perform(requeteAuthentifie("/api/evenements", alumni))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[0].nombreParticipants").value(1));

        mockMvc.perform(requeteAuthentifie("/api/evenements/{id}", alumni, evenement.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nombreParticipants").value(1));
    }

    @Test
    void compteEnAttenteVerifiePeutConsulterLesEvenements() throws Exception {
        Utilisateur enAttente = creerUtilisateur(TypeRole.VISITEUR, StatutCompte.EN_ATTENTE, true);
        creerEvenement(AudienceEvenement.TOUS, StatutEvenement.PUBLIE, Instant.now().plusSeconds(7200));

        mockMvc.perform(requeteAuthentifie("/api/evenements", enAttente))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void evenementDeTousEstAccessibleAuxOrganismesEtVisiteurs() throws Exception {
        Utilisateur visiteur = creerUtilisateur(TypeRole.VISITEUR, StatutCompte.ACTIF, true);
        Utilisateur organisme = creerUtilisateur(TypeRole.ORGANISME, StatutCompte.ACTIF, true);
        Evenement evenement = creerEvenement(
            AudienceEvenement.TOUS, StatutEvenement.PUBLIE, Instant.now().plusSeconds(7200));

        mockMvc.perform(requeteAuthentifie("/api/evenements/{id}", visiteur, evenement.getId()))
            .andExpect(status().isOk());
        mockMvc.perform(requeteAuthentifie("/api/evenements/{id}", organisme, evenement.getId()))
            .andExpect(status().isOk());
    }

    @Test
    void limiteLaTailleDesPagesEtRefuseLesParametresInvalides() throws Exception {
        mockMvc.perform(requeteAuthentifie("/api/evenements", alumni).param("taille", "49"))
            .andExpect(status().isBadRequest());
        mockMvc.perform(requeteAuthentifie("/api/evenements", alumni).param("page", "-1"))
            .andExpect(status().isBadRequest());
        mockMvc.perform(requeteAuthentifie("/api/evenements", alumni).param("periode", "INCONNUE"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void refuseLaConsultationSansAuthentification() throws Exception {
        mockMvc.perform(get("/api/evenements"))
            .andExpect(status().isForbidden());
    }

    @Test
    void refuseLesComptesNonVerifiesEtSuspendus() throws Exception {
        Utilisateur nonVerifie = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, false);
        Utilisateur suspendu = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.SUSPENDU, true);

        mockMvc.perform(requeteAuthentifie("/api/evenements", nonVerifie))
            .andExpect(status().isForbidden());
        mockMvc.perform(requeteAuthentifie("/api/evenements", suspendu))
            .andExpect(status().isForbidden());
    }

    @Test
    void conserveLaRegleDePremiereConnexion() throws Exception {
        etudiant.setDoitChangerMotDePasse(true);
        utilisateurRepository.saveAndFlush(etudiant);

        mockMvc.perform(requeteAuthentifie("/api/evenements", etudiant))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(
                "Vous devez définir votre nouveau mot de passe avant de continuer."));
    }

    private Utilisateur creerUtilisateur(TypeRole role, StatutCompte statut, boolean emailVerifie) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("evenement." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom("Membre");
        utilisateur.setNom(role.name());
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(emailVerifie);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    private Evenement creerEvenement(AudienceEvenement audience, StatutEvenement statut, Instant dateFin) {
        return creerEvenement(alumni, audience, statut, dateFin);
    }

    private Evenement creerEvenement(
            Utilisateur organisateur,
            AudienceEvenement audience,
            StatutEvenement statut,
            Instant dateFin) {
        Evenement evenement = new Evenement();
        evenement.setTitre("Rencontre de la communauté");
        evenement.setDescription("Un événement de test.");
        evenement.setLieu("Thiès");
        evenement.setDateDebut(dateFin.minusSeconds(3600));
        evenement.setDateFin(dateFin);
        evenement.setAudience(audience);
        evenement.setOfficielEpt(false);
        evenement.setStatut(statut);
        evenement.setOrganisateur(organisateur);
        return evenementRepository.saveAndFlush(evenement);
    }

    private void creerParticipation(
            Evenement evenement,
            Utilisateur utilisateur,
            ReponseParticipation reponse) {
        ParticipationEvenement participation = new ParticipationEvenement();
        participation.setEvenement(evenement);
        participation.setUtilisateur(utilisateur);
        participation.setReponse(reponse);
        participationRepository.saveAndFlush(participation);
    }

    private MockHttpServletRequestBuilder requeteAuthentifie(String chemin, Utilisateur utilisateur, Object... args) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return get(chemin, args).header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
