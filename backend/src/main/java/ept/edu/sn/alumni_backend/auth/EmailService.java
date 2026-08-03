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
}
