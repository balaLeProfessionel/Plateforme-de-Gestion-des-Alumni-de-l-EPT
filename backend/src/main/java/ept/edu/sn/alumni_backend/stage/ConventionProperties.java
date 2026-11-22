package ept.edu.sn.alumni_backend.stage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Signataire de l'école sur la convention de stage générée (STA-05) : le directeur de l'EPT.
 * Se change dans la configuration quand la direction change, sans toucher au modèle.
 */
@ConfigurationProperties(prefix = "app.convention")
public record ConventionProperties(
        @DefaultValue("Pr. Mamadou WADE") String directeur,
        @DefaultValue("Directeur de l’École Polytechnique de Thiès") String directeurTitre) {
}
