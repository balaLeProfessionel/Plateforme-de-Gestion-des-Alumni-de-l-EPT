package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.messagerie.repository.ConversationRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.MessageRepository;
import ept.edu.sn.alumni_backend.messagerie.repository.ParticipantRepository;
import ept.edu.sn.alumni_backend.messagerie.service.StockagePieceJointe;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Pièces jointes des messages : un fichier par message, servi aux seuls participants. */
@SpringBootTest
@AutoConfigureMockMvc
class MessageriePiecesJointesIntegrationTests {
    private static final String API = "/api/messagerie";
    private static final byte[] PDF = "%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 'I', 'H', 'D', 'R' };

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private ConversationRepository conversations;
    @Autowired private ParticipantRepository participants;
    @Autowired private MessageRepository messages;
    @Autowired private NotificationRepository notifications;
    @Autowired private StockagePieceJointe stockage;
    @Value("${app.storage.photos.dir:./data/photos}") private String repertoirePhotos;

    @AfterEach
    void nettoyer() {
        messages.findAll().stream().filter(m -> m.aPieceJointe()).forEach(m -> stockage.supprimer(m.getPieceJointe().getFichier()));
        notifications.deleteAll();
        messages.deleteAll();
        participants.deleteAll();
        conversations.deleteAll();
    }

    @Test
    void pj01_unPdfAccompagneDuTexteSeTelechargeParLesParticipants() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String id = idDe(ouvrirDirecte(awa, moussa));

        String messageId = idDe(envoyerFichier(awa, id, new MockMultipartFile("fichier", "Programme.pdf", "application/pdf", PDF), "Le programme")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.contenu").value("Le programme"))
            .andExpect(jsonPath("$.pieceJointe.nom").value("Programme.pdf"))
            .andExpect(jsonPath("$.pieceJointe.type").value("application/pdf"))
            .andExpect(jsonPath("$.pieceJointe.taille").value(PDF.length))
            .andExpect(jsonPath("$.pieceJointe.image").value(false)));

        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages/{m}/piece-jointe", id, messageId), moussa))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/pdf"))
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("Programme.pdf")))
            .andExpect(header().string("X-Content-Type-Options", "nosniff"))
            .andExpect(content().bytes(PDF));
        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", id), moussa))
            .andExpect(jsonPath("$.messages[0].pieceJointe.nom").value("Programme.pdf"));
    }

    @Test
    void pj02_uneImageSeuleSAfficheEtSAnnonceDansLaListe() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String id = idDe(ouvrirDirecte(awa, moussa));

        String messageId = idDe(envoyerFichier(awa, id, new MockMultipartFile("fichier", "photo.png", "image/png", PNG), null)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.contenu").value(""))
            .andExpect(jsonPath("$.pieceJointe.image").value(true)));

        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages/{m}/piece-jointe", id, messageId), moussa))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")));
        mockMvc.perform(authentifie(get(API + "/conversations"), moussa))
            .andExpect(jsonPath("$.contenu[0].dernierMessage.contenu").value("Pièce jointe : photo.png"))
            .andExpect(jsonPath("$.contenu[0].nombreNonLus").value(1));
    }

    @Test
    void pj03_quelquUnHorsDeLaConversationNiNeLitNiNEnvoie() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        Utilisateur intrus = membre("Intrus");
        String id = idDe(ouvrirDirecte(awa, moussa));
        String messageId = idDe(envoyerFichier(awa, id, new MockMultipartFile("fichier", "a.pdf", "application/pdf", PDF), null));
        long fichiersAvant = fichiersSurLeDisque();

        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages/{m}/piece-jointe", id, messageId), intrus))
            .andExpect(status().isNotFound());
        envoyerFichier(intrus, id, new MockMultipartFile("fichier", "b.pdf", "application/pdf", PDF), null)
            .andExpect(status().isNotFound());
        // Le droit est vérifié avant l'écriture : aucun fichier n'est laissé sur le disque.
        assertThat(fichiersSurLeDisque()).isEqualTo(fichiersAvant);
    }

    @Test
    void pj04_unTypeNonAccepteOuDeguiseEstRefuse() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String id = idDe(ouvrirDirecte(awa, moussa));
        long fichiersAvant = fichiersSurLeDisque();

        envoyerFichier(awa, id, new MockMultipartFile("fichier", "outil.exe", "application/octet-stream", PDF), null)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(containsString("type de fichier")));
        envoyerFichier(awa, id, new MockMultipartFile("fichier", "dessin.svg", "image/svg+xml", "<svg/>".getBytes()), null)
            .andExpect(status().isBadRequest());
        // Une image renommée en PDF : l'extension ne suffit pas.
        envoyerFichier(awa, id, new MockMultipartFile("fichier", "faux.pdf", "application/pdf", PNG), null)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le contenu du fichier ne correspond pas à son extension."));
        envoyerFichier(awa, id, new MockMultipartFile("fichier", "binaire.txt", "text/plain", new byte[] { 'a', 0, 'b' }), null)
            .andExpect(status().isBadRequest());
        assertThat(fichiersSurLeDisque()).isEqualTo(fichiersAvant);
    }

    @Test
    void pj05_unFichierDePlusDeDixMoEstRefuse() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String id = idDe(ouvrirDirecte(awa, moussa));
        byte[] gros = Arrays.copyOf(PDF, 10 * 1024 * 1024 + 1);

        envoyerFichier(awa, id, new MockMultipartFile("fichier", "gros.pdf", "application/pdf", gros), null)
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le fichier joint ne doit pas dépasser 10 Mo."));
    }

    @Test
    void pj06_supprimerLeMessageRetireLeFichier() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String id = idDe(ouvrirDirecte(awa, moussa));
        String messageId = idDe(envoyerFichier(awa, id, new MockMultipartFile("fichier", "a.pdf", "application/pdf", PDF), "Tiens"));
        long fichiersAvant = fichiersSurLeDisque();

        mockMvc.perform(authentifie(delete(API + "/conversations/{id}/messages/{m}", id, messageId), awa))
            .andExpect(status().isNoContent());

        assertThat(fichiersSurLeDisque()).isEqualTo(fichiersAvant - 1);
        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages/{m}/piece-jointe", id, messageId), moussa))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(API + "/conversations/{id}/messages", id), moussa))
            .andExpect(jsonPath("$.messages[0].supprime").value(true))
            .andExpect(jsonPath("$.messages[0].pieceJointe").doesNotExist());
    }

    @Test
    void pj07_leNomDuFichierPerdSonCheminEtLeTexteSeulResteObligatoireSansFichier() throws Exception {
        Utilisateur awa = membre("Awa");
        Utilisateur moussa = membre("Moussa");
        String id = idDe(ouvrirDirecte(awa, moussa));

        envoyerFichier(awa, id, new MockMultipartFile("fichier", "../../etc/notes.txt", "text/plain", "Bonjour".getBytes()), null)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.pieceJointe.nom").value("notes.txt"));
        envoyerFichier(awa, id, new MockMultipartFile("fichier", "vide.txt", "text/plain", new byte[0]), "  ")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Écrivez un message ou joignez un fichier."));
    }

    // --- Outils ---

    private long fichiersSurLeDisque() throws IOException {
        Path dossier = Path.of(repertoirePhotos).toAbsolutePath().normalize().resolve("messagerie");
        if (!Files.isDirectory(dossier)) return 0;
        try (Stream<Path> fichiers = Files.list(dossier)) {
            return fichiers.count();
        }
    }

    private Utilisateur membre(String prenom) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("messagerie-pj." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom(prenom);
        utilisateur.setNom("Pj" + UUID.randomUUID().toString().substring(0, 8));
        utilisateur.setRole(TypeRole.ALUMNI);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        return utilisateurs.saveAndFlush(utilisateur);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }

    private ResultActions ouvrirDirecte(Utilisateur moi, Utilisateur destinataire) throws Exception {
        return mockMvc.perform(authentifie(post(API + "/conversations/directes"), moi)
            .contentType(MediaType.APPLICATION_JSON).content("{\"destinataireId\":\"" + destinataire.getId() + "\"}"));
    }

    private ResultActions envoyerFichier(Utilisateur moi, String conversationId, MockMultipartFile fichier, String contenu) throws Exception {
        var requete = multipart(API + "/conversations/{id}/messages", conversationId).file(fichier)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(moi)));
        if (contenu != null) requete.param("contenu", contenu);
        return mockMvc.perform(requete);
    }

    private static String idDe(ResultActions resultat) throws Exception {
        return JsonPath.read(resultat.andReturn().getResponse().getContentAsString(), "$.id");
    }
}
