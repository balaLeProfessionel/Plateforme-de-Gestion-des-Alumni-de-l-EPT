package ept.edu.sn.alumni_backend.config;

import org.apache.catalina.Host;
import org.apache.catalina.valves.ErrorReportValve;
import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;

/**
 * Les erreurs que Tomcat traite lui-même, avant Spring (par exemple une URL contenant « %2F »), produisent une page HTML
 * qui affiche la version du serveur. On installe sur l'hôte une page d'erreur sans version ni détail : Tomcat n'ajoute
 * pas la sienne quand une page du même type est déjà présente.
 */
@Configuration
public class TomcatConfig implements WebServerFactoryCustomizer<TomcatServletWebServerFactory> {

    @Override
    public void customize(TomcatServletWebServerFactory factory) {
        factory.addContextCustomizers(contexte -> {
            if (contexte.getParent() instanceof Host hote) {
                ErrorReportValve pageErreur = new ErrorReportValve();
                pageErreur.setShowServerInfo(false);
                pageErreur.setShowReport(false);
                hote.getPipeline().addValve(pageErreur);
            }
        });
    }
}
