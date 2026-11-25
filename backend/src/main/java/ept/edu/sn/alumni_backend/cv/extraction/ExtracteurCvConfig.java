package ept.edu.sn.alumni_backend.cv.extraction;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Choisit l'extracteur d'après CV_IA_FOURNISSEUR :
 * <ul>
 *   <li>{@code anthropic} : Claude, en natif ;</li>
 *   <li>{@code openai} : toute API compatible OpenAI (OpenAI, Mistral, Gemini, OpenRouter, Ollama…),
 *       avec CV_IA_URL ;</li>
 *   <li>{@code demo} : profil fictif, sans IA (développement) ;</li>
 *   <li>autre ou vide : import de CV désactivé.</li>
 * </ul>
 * Le modèle (CV_IA_MODELE) et la clé (CV_IA_CLE) sont lus par Spring AI (voir application.properties).
 */
@Configuration
public class ExtracteurCvConfig {
    private static final Logger LOG = LoggerFactory.getLogger(ExtracteurCvConfig.class);

    @Bean
    ExtracteurCv extracteurCv(
            ObjectProvider<ChatModel> modeles,
            @Value("${app.cv.fournisseur:aucun}") String fournisseur,
            @Value("${app.cv.images:true}") boolean imagesAcceptees,
            @Value("${app.cv.nom-fournisseur:}") String nomFournisseur,
            @Value("${app.cv.modele:}") String nomModele) {
        String choix = fournisseur.trim().toLowerCase(Locale.ROOT);
        switch (choix) {
            case "demo" -> {
                LOG.warn("Import de CV en mode démonstration : profil fictif, aucune IA appelée");
                return new ExtracteurCvDemo();
            }
            case "anthropic", "openai" -> {
                ChatModel modele = modeles.getIfUnique();
                if (modele == null) {
                    LOG.error("Import de CV : aucun modèle Spring AI pour le fournisseur « {} »", choix);
                    return new ExtracteurCvIndisponible();
                }
                String nom = !nomFournisseur.isBlank() ? nomFournisseur.trim()
                    : "anthropic".equals(choix) ? "Anthropic (Claude)" : "un service d'IA externe";
                LOG.info("Import de CV : fournisseur « {} », images {}", choix, imagesAcceptees ? "acceptées" : "refusées");
                return new ExtracteurCvSpringAi(modele, nomModele, choix, nom, imagesAcceptees);
            }
            default -> {
                LOG.info("Import de CV désactivé (CV_IA_FOURNISSEUR non renseigné)");
                return new ExtracteurCvIndisponible();
            }
        }
    }
}
