package ept.edu.sn.alumni_backend.partenariat.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/** Toutes les heures : expiration des conventions échues et alerte avant échéance. Sans effet si rien n'a changé. */
@Component
@RequiredArgsConstructor
public class EcheancesConventionsScheduler {
    private final ConventionsPartenariatService conventionsService;

    @Scheduled(fixedRate = 3_600_000, initialDelay = 60_000)
    public void actualiser() {
        conventionsService.actualiserEcheances();
    }
}
