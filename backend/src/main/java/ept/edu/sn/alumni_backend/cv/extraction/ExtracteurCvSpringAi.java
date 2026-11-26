package ept.edu.sn.alumni_backend.cv.extraction;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ResponseEntity;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.content.Media;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeTypeUtils;

import ept.edu.sn.alumni_backend.cv.TypeSourceCv;

/**
 * Extraction par le fournisseur que Spring AI a configuré (Claude en natif, ou toute API compatible OpenAI :
 * Mistral, Gemini, Ollama…). Changer de modèle ou de fournisseur ne touche pas ce code.
 */
public class ExtracteurCvSpringAi implements ExtracteurCv {
    private final ChatClient client;
    private final String fournisseur;
    private final String nomFournisseur;
    private final boolean imagesAcceptees;

    /**
     * @param nomModele modèle choisi par CV_IA_MODELE ; vide : celui des propriétés Spring AI du fournisseur
     */
    public ExtracteurCvSpringAi(ChatModel modele, String nomModele, String fournisseur, String nomFournisseur,
            boolean imagesAcceptees) {
        ChatClient.Builder constructeur = ChatClient.builder(modele);
        if (nomModele != null && !nomModele.isBlank()) {
            constructeur.defaultOptions(ChatOptions.builder().model(nomModele.trim()));
        }
        this.client = constructeur.build();
        this.fournisseur = fournisseur;
        this.nomFournisseur = nomFournisseur;
        this.imagesAcceptees = imagesAcceptees;
    }

    @Override
    public boolean disponible() {
        return true;
    }

    @Override
    public boolean imagesAcceptees() {
        return imagesAcceptees;
    }

    @Override
    public String nomFournisseur() {
        return nomFournisseur;
    }

    @Override
    public ResultatExtraction extraire(ContenuCv contenu) {
        if (contenu.type() == TypeSourceCv.IMAGES && !imagesAcceptees) {
            throw new IllegalStateException("Le modèle configuré ne lit pas les images");
        }
        ResponseEntity<ChatResponse, ProfilExtrait> reponse = client.prompt()
            .system(ConsignesExtraction.SYSTEME)
            .user(message -> {
                if (contenu.type() == TypeSourceCv.TEXTE) {
                    // Le texte du CV passe en paramètre : ses accolades ne sont pas interprétées comme un gabarit
                    message.text(ConsignesExtraction.TEXTE).param("cv", contenu.texte());
                } else {
                    message.text(ConsignesExtraction.IMAGES).media(contenu.imagesJpeg().stream()
                        .map(octets -> new Media(MimeTypeUtils.IMAGE_JPEG, new ByteArrayResource(octets)))
                        .toArray(Media[]::new));
                }
            })
            .call()
            .responseEntity(ProfilExtrait.class);

        ChatResponseMetadata metadonnees = reponse.getResponse() == null ? null : reponse.getResponse().getMetadata();
        Usage usage = metadonnees == null ? null : metadonnees.getUsage();
        return new ResultatExtraction(
            reponse.getEntity(),
            fournisseur,
            metadonnees == null ? null : metadonnees.getModel(),
            usage == null ? null : usage.getPromptTokens(),
            usage == null ? null : usage.getCompletionTokens());
    }
}
