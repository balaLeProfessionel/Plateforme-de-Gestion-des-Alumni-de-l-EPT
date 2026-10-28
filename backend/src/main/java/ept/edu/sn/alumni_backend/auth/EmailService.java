package ept.edu.sn.alumni_backend.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    /**
     * En développement : le code est écrit dans les logs.
     * Récupère-le avec : docker compose logs -f api
     * En production : brancher ici un JavaMailSender (SMTP).
     */
    public void envoyerCodeOtp(String destinataire, String code) {
        log.info("======================================================");
        log.info("  CODE OTP pour {} : {}", destinataire, code);
        log.info("  (valable 10 minutes)");
        log.info("======================================================");
    }

    public void envoyerNotification(String destinataire, String sujet, String message) {
        log.info("======================================================");
        log.info("  NOTIFICATION pour {} : {}", destinataire, sujet);
        log.info("  {}", message);
        log.info("======================================================");
    }

    /**
     * Identifiants d'un compte créé par l'administration. Le mot de passe provisoire n'est jamais journalisé :
     * l'administration le voit une fois à l'écran ; en production, le corps du message part par SMTP.
     */
    public void envoyerIdentifiants(String destinataire, String salutation, String motDePasseProvisoire) {
        log.info("======================================================");
        log.info("  IDENTIFIANTS pour {} : compte créé par l'administration", destinataire);
        log.info("  Bonjour {}, connectez-vous avec cette adresse et le mot de passe provisoire (masqué ici, {} caractères) ;",
            salutation, motDePasseProvisoire.length());
        log.info("  vous choisirez votre propre mot de passe à la première connexion.");
        log.info("======================================================");
    }

    public void envoyerCodeReinitialisation(String destinataire, String code) {
        log.info("======================================================");
        log.info("  CODE DE RÉINITIALISATION pour {} : {}", destinataire, code);
        log.info("  (valable 10 minutes)");
        log.info("======================================================");
    }
}
