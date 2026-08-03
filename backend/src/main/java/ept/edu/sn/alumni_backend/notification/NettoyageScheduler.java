package ept.edu.sn.alumni_backend.notification;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import ept.edu.sn.alumni_backend.utilisateur.CodeVerificationRepository;

@Component
public class NettoyageScheduler {

    private static final Logger log = LoggerFactory.getLogger(NettoyageScheduler.class);
    private final CodeVerificationRepository codeVerificationRepository;

    public NettoyageScheduler(CodeVerificationRepository codeVerificationRepository) {
        this.codeVerificationRepository = codeVerificationRepository;
    }

    // Toutes les heures
    @Scheduled(fixedRate = 3_600_000)
    public void nettoyerCodesExpires() {
        int supprimes = codeVerificationRepository.supprimerExpires(LocalDateTime.now());
        if (supprimes > 0) {
            log.info("Nettoyage : {} code(s) OTP expiré(s) supprimé(s)", supprimes);
        }
    }
}