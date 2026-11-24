package ept.edu.sn.alumni_backend.messagerie.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Au démarrage, range chaque alumni et chaque étudiant dans les communautés de sa promo et de sa filière, sans
 * message d'arrivée (ce serait des centaines de messages à la fois). Idempotent : un second démarrage ne change rien.
 * Une personne arrivée ensuite y entre en ouvrant l'onglet « Communautés », et y est alors saluée.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InitialisationCommunautes implements ApplicationRunner {
    private final CommunauteService communautes;

    @Override
    public void run(ApplicationArguments arguments) {
        int nombre = communautes.synchroniserTous();
        log.info("Communautés de promo et de filière à jour pour {} membres.", nombre);
    }
}
