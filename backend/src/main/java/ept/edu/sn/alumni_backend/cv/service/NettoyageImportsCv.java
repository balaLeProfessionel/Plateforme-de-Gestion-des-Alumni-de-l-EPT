package ept.edu.sn.alumni_backend.cv.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/** Efface les brouillons de CV non relus au bout de 7 jours (minimisation des données personnelles). */
@Component
@RequiredArgsConstructor
class NettoyageImportsCv {
    private static final Logger LOG = LoggerFactory.getLogger(NettoyageImportsCv.class);

    private final ImportCvService service;

    @Scheduled(fixedRate = 3_600_000, initialDelay = 60_000)
    void nettoyer() {
        int nombre = service.nettoyer();
        if (nombre > 0) {
            LOG.info("Imports de CV : {} brouillon(s) expiré(s) ou analyse(s) interrompue(s) clôturé(s)", nombre);
        }
    }
}
