package ept.edu.sn.alumni_backend.mentorat;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

/** Cas N-* du catalogue : qui est prévenu, et jamais pour une action refusée. */
@SpringBootTest
@AutoConfigureMockMvc
class MentoratNotificationsIntegrationTests extends MentoratTestsBase {
    @MockitoSpyBean
    private EmailService emailService;

    private Utilisateur mentor;
    private Utilisateur etudiant;
    private UUID data;
    private UUID profilId;

    @BeforeEach
    void preparer() throws Exception {
        mentor = creerUtilisateur(TypeRole.ALUMNI, "Diop");
        etudiant = creerUtilisateur(TypeRole.ETUDIANT, "Ndiaye");
        data = domaine("DATA_IA");
        profilId = creerProfil(mentor, true, 1, data);
        clearInvocations(emailService);
    }

    @Test
    void n01_chaqueEtapePrevientLAutreParticipant() throws Exception {
        UUID mentorat = demander(etudiant, profilId, data);
        verify(emailService).envoyerNotification(eq(mentor.getEmail()), eq("Nouvelle demande de mentorat"), anyString());

        changerStatut(mentorat, "accepter", mentor);
        verify(emailService).envoyerNotification(eq(etudiant.getEmail()), eq("Demande de mentorat acceptée"), anyString());

        planifier(mentorat, etudiant);
        verify(emailService).envoyerNotification(eq(mentor.getEmail()), eq("Nouvelle séance de mentorat"), anyString());

        changerStatut(mentorat, "terminer", mentor);
        verify(emailService).envoyerNotification(eq(etudiant.getEmail()), eq("Mentorat terminé"), anyString());
    }

    @Test
    void n02_leRefusTransmetLeMotifEtLAnnulationPrevientLeMentor() throws Exception {
        UUID refusee = demander(etudiant, profilId, data);
        envoyer(patch("/api/mentorat/mentorats/{id}/refuser", refusee), mentor, "{\"motif\":\"Agenda complet\"}")
            .andExpect(status().isOk());
        verify(emailService).envoyerNotification(
            eq(etudiant.getEmail()), eq("Demande de mentorat refusée"), contains("Agenda complet"));

        UUID annulee = demander(etudiant, profilId, data);
        changerStatut(annulee, "annuler", etudiant);
        verify(emailService).envoyerNotification(eq(mentor.getEmail()), eq("Demande de mentorat annulée"), anyString());
    }

    @Test
    void n03_aucuneNotificationPourUneActionRefusee() throws Exception {
        UUID mentorat = demander(etudiant, profilId, data);
        clearInvocations(emailService);

        envoyer(patch("/api/mentorat/mentorats/{id}/accepter", mentorat), etudiant, "{}")
            .andExpect(status().isForbidden());
        envoyer(post("/api/mentorat/mentorats"), etudiant, demande(profilId, data))
            .andExpect(status().isConflict());

        verify(emailService, never()).envoyerNotification(anyString(), anyString(), anyString());
    }
}
